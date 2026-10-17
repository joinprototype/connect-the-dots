#!/bin/sh
# Demo screenshots for a sprint review: every demo page in dark and light, desktop and phone.
# Usage: [PAGES="name=/path …"] [WAIT=ms] tools/qa/demo-shots.sh <out-dir> [base-url]   (maps need ~12000)
# Needs the dev server (cargo run -q -- serve) and Google Chrome. Prints pages with console errors.
set -euf  # -f: no globbing, page paths contain "?"
OUT=${1:?usage: demo-shots.sh <out-dir> [base-url]}
BASE=${2:-http://127.0.0.1:4321}
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$OUT"
# PAGES="name=/path name2=/path2" overrides the list below
PAGES=${PAGES:-"home=/ stories=/c/ gates=/e/bill-gates/ bezos=/e/jeff-bezos/ tesla=/e/tesla/ \
soviet-collapse=/e/dissolution-of-the-soviet-union/ story-bezos=/e/jeff-bezos/story/ \
route-gates-ibm=/p/bill-gates--ibm/ chapter-ussr=/c/rise-and-fall-of-the-soviet-union/ \
explore=/x/ explore-route=/x/?from=bill-gates&to=ibm map=/w/ \
behind-meta=/q/behind/meta-platforms/ behind-ussr=/q/behind/soviet-union/ behind-gamestop=/q/behind/gamestop/ \
why-dissolution=/q/why/dissolution-of-the-soviet-union/ benefited-october=/q/benefited/october-revolution/ \
story-why-dissolution=/q/why/dissolution-of-the-soviet-union/story/ questions-behind=/q/behind/"}
fail=0
for entry in $PAGES; do
  name=${entry%%=*}; path=${entry#*=}
  for scheme in dark light; do
    for size in desktop phone; do
      flag=""; [ "$size" = phone ] && flag="--size=390x844"
      shot="$OUT/$name-$scheme-$size.png"
      res=$(node "$HERE/cdp.mjs" "$BASE$path" --wait=${WAIT:-3500} --scheme=$scheme $flag --shot="$shot" 2>/dev/null || true)
      n=$(printf '%s' "$res" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).errors.length)}catch{console.log("?")}})')
      if [ "$n" != "0" ]; then echo "errors=$n  $name $scheme $size  $path"; fail=1; fi
    done
  done
done
echo "screenshots in $OUT"
exit $fail
