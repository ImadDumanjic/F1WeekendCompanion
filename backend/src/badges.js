export async function awardBadges(client, userId, raceYear, raceRound, currentPts, pred, result) {
  const { rows: allBadges } = await client.query('SELECT id, slug FROM badges');
  const badgeMap = Object.fromEntries(allBadges.map(b => [b.slug, b.id]));

  const { rows: existing } = await client.query(
    'SELECT badge_id FROM user_badges WHERE user_id = $1',
    [userId]
  );
  const has = new Set(existing.map(r => r.badge_id));

  const award = async (slug) => {
    const id = badgeMap[slug];
    if (id && !has.has(id)) {
      await client.query(
        'INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [userId, id]
      );
      has.add(id);
    }
  };

  if (currentPts > 0) {
    await award('green_light');
  }

  if (pred.p1 === result.p1 && pred.p2 === result.p2 && pred.p3 === result.p3) {
    await award('podium_prophet');
  }

  // Streak: LEFT JOIN race_results so calendar gaps break the streak.
  // Current race scored_at is still NULL at this point, so handle it by prepending currentPts.
  const { rows: history } = await client.query(
    `SELECT COALESCE(p.points_earned, 0) AS points_earned
     FROM race_results r
     LEFT JOIN predictions p
       ON p.race_year  = r.race_year
      AND p.race_round = r.race_round
      AND p.user_id    = $1
      AND p.is_locked  = TRUE
     WHERE r.scored_at IS NOT NULL
       AND (r.race_year < $2 OR (r.race_year = $2 AND r.race_round < $3))
     ORDER BY r.race_year DESC, r.race_round DESC`,
    [userId, raceYear, raceRound]
  );

  let streak = 0;
  for (const row of [{ points_earned: currentPts }, ...history]) {
    if (row.points_earned > 0) streak++;
    else break;
  }

  if (streak >= 3)  await award('hat_trick_hero');
  if (streak >= 5)  await award('race_pace');
  if (streak >= 10) await award('clean_air');
}
