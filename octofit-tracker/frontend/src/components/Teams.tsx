import { useApiResource } from '../api/useApiResource.js';

type Team = { _id?: string; name: string; mascot: string; members: unknown[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const { data, loading, error } = useApiResource<TeamResponse>('/api/teams');

  return <section aria-labelledby="teams-heading" className="mb-4">
    <h2 id="teams-heading" className="h4">Teams</h2>
    <p>Manage teams and members.</p>
    {loading && <p role="status">Loading teams...</p>}
    {error && <p role="alert">Unable to load teams. Please try again later.</p>}
    {data && data.teams.length === 0 && <p>No teams yet.</p>}
    {data && data.teams.length > 0 && <ul className="list-group">
      {data.teams.map((team) => <li className="list-group-item" key={team._id ?? team.name}>
        <strong>{team.name}</strong> <span>{team.mascot}</span>
        <span className="ms-2">{team.members?.length ?? 0} members</span>
      </li>)}
    </ul>}
  </section>;
}
