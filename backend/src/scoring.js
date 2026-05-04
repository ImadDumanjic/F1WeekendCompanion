export async function applyScoring(client, raceYear, raceRound) {
  const { rows: [result] } = await client.query(
    'SELECT * FROM race_results WHERE race_year = $1 AND race_round = $2',
    [raceYear, raceRound]
  );
  if (!result) return 0;

  const { rows: predictions } = await client.query(
    'SELECT * FROM predictions WHERE race_year = $1 AND race_round = $2 AND is_locked = TRUE',
    [raceYear, raceRound]
  );

  for (const pred of predictions) {
    let pts = 0;
    if (pred.p1 === result.p1) pts += 15;
    if (pred.p2 === result.p2) pts += 10;
    if (pred.p3 === result.p3) pts += 8;
    if (pred.fastest_lap && pred.fastest_lap === result.fastest_lap) pts += 5;
    const scDiff = Math.abs((pred.safety_car_count ?? 0) - (result.safety_car_count ?? 0));
    if (scDiff === 0)      pts += 5;
    else if (scDiff === 1) pts += 2;

    await client.query('UPDATE predictions SET points_earned = $1 WHERE id = $2', [pts, pred.id]);
    if (pts > 0) {
      await client.query('UPDATE users SET score = score + $1 WHERE id = $2', [pts, pred.user_id]);
    }
  }

  return predictions.length;
}
