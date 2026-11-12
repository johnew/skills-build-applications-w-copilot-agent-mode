import { useApiResource } from '../api/useApiResource.js';

type Activity = { type: string; minutes: number; points: number; occurredAt?: string };
type ActivityResponse = { activities: Activity[] };

export default function Activities() {
  const { data, loading, error } = useApiResource<ActivityResponse>('/api/activities');

  return <section aria-labelledby="activities-heading" className="mb-4">
    <h2 id="activities-heading" className="h4">Activities</h2>
    <p>Track student activity minutes and points.</p>
    {loading && <p role="status">Loading activities...</p>}
    {error && <p role="alert">Unable to load activities. Please try again later.</p>}
    {data && data.activities.length === 0 && <p>No activities yet.</p>}
    {data && data.activities.length > 0 && <ul className="list-group">
      {data.activities.map((activity, index) => <li className="list-group-item" key={`${activity.type}-${activity.occurredAt ?? index}`}>
        <strong>{activity.type}</strong> {activity.minutes} minutes, {activity.points} points
      </li>)}
    </ul>}
  </section>;
}
