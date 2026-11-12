import { useState } from 'react';
import { useApiResource } from '../api/useApiResource.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const [userEmail, setUserEmail] = useState('mona@example.com');
  const { data, loading, error } = useApiResource<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);

  return <section aria-labelledby="workouts-heading" className="mb-4">
    <h2 id="workouts-heading" className="h4">Workout suggestions</h2>
    <p>Recommend workouts from activity patterns.</p>
    <label className="form-label" htmlFor="workout-user">Suggestions for</label>
    <select id="workout-user" className="form-select w-auto mb-3" value={userEmail} onChange={(event) => setUserEmail(event.target.value)}>
      <option value="mona@example.com">Mona</option>
      <option value="hubot@example.com">Hubot</option>
    </select>
    {loading && <p role="status">Loading workout suggestions...</p>}
    {error && <p role="alert">Unable to load workout suggestions. Please try again later.</p>}
    {data && data.suggestions.length === 0 && <p>No workout suggestions available.</p>}
    {data && data.suggestions.length > 0 && <ul className="list-group">
      {data.suggestions.map((workout) => <li className="list-group-item" key={workout.title}>
        <h3 className="h5">{workout.title}</h3>
        <p>{workout.focus} | {workout.minutes} minutes | {workout.difficulty}</p>
        <p className="mb-0">{workout.reason}</p>
      </li>)}
    </ul>}
  </section>;
}
