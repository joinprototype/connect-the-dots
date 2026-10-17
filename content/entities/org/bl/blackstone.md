---
uid: 01M55MBXMXSQCPXYTKQC1CRGXT
id: blackstone
type: org
name: "Blackstone"
aliases: ["The Blackstone Group", "Blackstone Inc.", "The Blackstone Group L.P.", "The Blackstone Group Inc."]
summary: "American alternative asset manager founded in 1985 by Stephen A. Schwarzman and Peter G. Peterson."
when: "1985/.."
claims:
  - id: c1
    rel: owns_stake
    to: blackstone-financial-management
    when: "1988/1994"
    percent: 50
    as_of: "1988"
    note: "Blackstone took the stake for a $5 million credit line, per King of Capital as reported by Bloomberg. Its share fell to about 40% by 1989 and about 35% by 1992; Blackstone says it sold its interest in 1994."
    src:
      - {s: bloomberg-2013-09-30-schwarzman-heroic-mistake, at: "Section \"'Gifted' Fink\", paragraph 1 (citing King of Capital by David Carey and John Morris)", quote: "Blackstone gave Fink and his team, which included now-Evercore Partners Inc. CEO Ralph Schlosstein, a $5 million credit line in exchange for a 50 percent stake in the bond business."}
      - {s: blackstone-424b4-2007, at: "Business, Our History", quote: "We sold our interest in BlackRock Inc. in 1994."}
  - id: c2
    rel: invested_in
    to: blackstone-financial-management
    when: "1988"
    note: "Schwarzman's own account. Bloomberg, citing King of Capital, describes the capital as a $5 million credit line."
    src:
      - {s: cnbc-2017-06-22-blackstone-blackrock-names, at: "Paragraph 3 of the article body, after the Key Points (Schwarzman on CNBC's Squawk Box)", quote: "\"They used to be called Blackstone Financial,\" Schwarzman said. \"We started in business together. We put up the initial capital.\"", by: stephen-a-schwarzman}
---
