//! `ctd serve`: dev server with file watching, rebuilds and live reload (SSE).

use std::{
    convert::Infallible,
    net::SocketAddr,
    path::PathBuf,
    sync::mpsc,
    time::Duration,
};

use anyhow::Result;
use axum::{
    Router,
    extract::Request,
    http::{HeaderValue, StatusCode, header},
    middleware::{self, Next},
    response::{
        Response,
        sse::{Event, KeepAlive, Sse},
    },
    routing::{get, post},
};
use futures_util::Stream;
use notify::{RecursiveMode, Watcher};
use tokio::sync::broadcast;
use tokio_stream::{StreamExt, wrappers::BroadcastStream};
use tower_http::services::{ServeDir, ServeFile};

fn sse(rx: broadcast::Receiver<()>) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let stream = BroadcastStream::new(rx).filter_map(|m| m.ok()).map(|_| Ok(Event::default().data("reload")));
    Sse::new(stream).keep_alive(KeepAlive::default())
}

/// Every response says `no-cache`: the browser checks each file again (a 304 when it has not changed),
/// so after a rebuild a page never mixes new files with cached old ones.
async fn no_cache(req: Request, next: Next) -> Response {
    let mut res = next.run(req).await;
    res.headers_mut().insert(header::CACHE_CONTROL, HeaderValue::from_static("no-cache"));
    res
}

fn relevant(ev: &notify::Result<notify::Event>) -> bool {
    ev.as_ref().is_ok_and(|e| !matches!(e.kind, notify::EventKind::Access(_)) && !e.paths.is_empty())
}

fn watch_loop(root: PathBuf, out: PathBuf, tx: broadcast::Sender<()>) {
    let (wtx, wrx) = mpsc::channel();
    let mut watcher = match notify::recommended_watcher(wtx) {
        Ok(w) => w,
        Err(e) => {
            eprintln!("cannot watch files: {e}");
            return;
        }
    };
    for dir in ["content", "theme", "web/dist"] {
        let p = root.join(dir);
        if p.exists()
            && let Err(e) = watcher.watch(&p, RecursiveMode::Recursive)
        {
            eprintln!("cannot watch {}: {e}", p.display());
        }
    }
    loop {
        let Ok(first) = wrx.recv() else { return };
        let mut changed = relevant(&first);
        while let Ok(ev) = wrx.recv_timeout(Duration::from_millis(200)) {
            changed |= relevant(&ev);
        }
        if changed {
            crate::rebuild(&root, &out, true);
            let _ = tx.send(());
        }
    }
}

pub fn run(root: PathBuf, port: u16) -> Result<()> {
    // the dev build (with live reload) lives apart from `dist/`, which only `ctd build` writes, so a
    // deploy can never pick up dev scripts
    let out = root.join(".cache").join("serve");
    crate::rebuild(&root, &out, true);
    let (tx, _) = broadcast::channel::<()>(16);
    {
        let (root, out, tx) = (root.clone(), out.clone(), tx.clone());
        std::thread::spawn(move || watch_loop(root, out, tx));
    }
    let rt = tokio::runtime::Builder::new_multi_thread().enable_all().build()?;
    rt.block_on(async move {
        let sse_tx = tx.clone();
        let files = ServeDir::new(&out).append_index_html_on_directories(true).not_found_service(ServeFile::new(out.join("404.html")));
        let synth = ServeDir::new(root.join(".cache").join("world-synth"));
        let error_log = root.join(".cache").join("client-errors.log");
        let app = Router::new()
            .nest_service("/world-synth", synth)
            .route(
                "/__client-error",
                post(move |body: String| {
                    let log = error_log.clone();
                    async move {
                        let line = body.replace('\n', " ");
                        eprintln!("\x1b[31m[browser]\x1b[0m {line}");
                        if let Some(dir) = log.parent() {
                            let _ = std::fs::create_dir_all(dir);
                        }
                        let _ = std::fs::OpenOptions::new()
                            .create(true)
                            .append(true)
                            .open(&log)
                            .and_then(|mut f| std::io::Write::write_all(&mut f, format!("{line}\n").as_bytes()));
                        StatusCode::NO_CONTENT
                    }
                }),
            )
            .route(
                "/__livereload",
                get(move || {
                    let rx = sse_tx.subscribe();
                    async move { sse(rx) }
                }),
            )
            .fallback_service(files)
            .layer(middleware::from_fn(no_cache));
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        let listener = tokio::net::TcpListener::bind(addr).await?;
        println!("\n  connect·the·dot dev server → http://{addr}/\n  watching content/, theme/, web/dist/ (Ctrl+C to stop)\n");
        axum::serve(listener, app).await?;
        Ok(())
    })
}
