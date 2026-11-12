import { getJson } from '../api/client.js';
import { useApiResource } from '../api/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, loading, error } = useApiResource<LeaderboardResponse>('/api/leaderboard', getJson<LeaderboardResponse>);

  return <section aria-labelledby="leaderboard-heading" className="mb-4">
    <h2 id="leaderboard-heading" className="h4">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {loading && <p role="status">Loading leaderboard...</p>}
    {error && <p role="alert">Unable to load leaderboard. Please try again later.</p>}
    {data && data.leaderboard.length === 0 && <p>No leaderboard rankings yet.</p>}
    {data && data.leaderboard.length > 0 && <ol className="list-group list-group-numbered">
      {data.leaderboard.map((entry) => <li className="list-group-item d-flex justify-content-between" key={entry.teamName}>
        <span>{entry.teamName}</span><strong>{entry.totalPoints} points</strong>
      </li>)}
    </ol>}
  </section>;
}
