import { Activity, Team, User, Workout } from '../models/index.js';

type ActivityInput = {
  userId: string;
  teamId: string;
  type: string;
  minutes: number;
};

type TeamInput = {
  name: string;
  mascot: string;
  members?: string[];
};

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function parseActivityInput(input: unknown): ActivityInput {
  if (!isRecord(input)) throw httpError(400, 'Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw httpError(400, 'Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw httpError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) throw httpError(400, 'Minutes must be a positive number');
  return { userId, teamId, type: type.trim(), minutes };
}

function parseTeamInput(input: unknown): TeamInput {
  if (!isRecord(input)) throw httpError(400, 'Team details are required');
  const { name, mascot, members } = input;
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'Team mascot is required');
  if (members !== undefined && (!Array.isArray(members) || !members.every(isObjectId))) {
    throw httpError(400, 'Members must be an array of valid user IDs');
  }
  return { name: name.trim(), mascot: mascot.trim(), members: members as string[] | undefined };
}

export async function listActivities() {
  return Activity.find().sort({ occurredAt: -1 }).lean();
}

export async function createActivity(input: unknown) {
  const activityInput = parseActivityInput(input);
  const [user, team] = await Promise.all([
    User.findById(activityInput.userId).select('_id'),
    Team.findById(activityInput.teamId).select('_id'),
  ]);
  if (!user || !team) throw httpError(400, 'The selected user and team must exist');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: activityInput.type,
    minutes: activityInput.minutes,
    points: activityInput.minutes,
    occurredAt: new Date(),
  });
  return activity;
}

export async function listTeams() {
  return Team.find().sort({ name: 1 }).lean();
}

export async function createTeam(input: unknown) {
  const teamInput = parseTeamInput(input);
  const members = [...new Set((teamInput.members ?? []).map((member) => member.toLowerCase()))];
  if (members.length) {
    const existingMembers = await User.find({ _id: { $in: members } }).select('_id').lean();
    if (existingMembers.length !== members.length) throw httpError(400, 'Every team member must be an existing user');
  }
  return Team.create({ ...teamInput, members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }: { _id: string; totalPoints: number }) => [String(_id), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(String(team._id)) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).select('fitnessGoal').lean();
  if (!user) throw httpError(404, 'User not found');

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).select('type').lean();
  const activityFocus = recentActivities.map(({ type }) => {
    const normalized = type.trim().toLowerCase();
    const focus = ['run', 'running', 'cycle', 'cycling', 'walk', 'walking'].includes(normalized) ? 'endurance' : normalized;
    return { type, focus };
  });
  const focusPriority = [...new Set([user.fitnessGoal.trim().toLowerCase(), ...activityFocus.map(({ focus }) => focus)])];
  const workouts = await Workout.find({ focus: { $in: focusPriority } }).collation({ locale: 'en', strength: 2 }).lean();
  const focusRank = new Map(focusPriority.map((focus, index) => [focus, index]));
  return workouts
    .sort((left, right) => (focusRank.get(left.focus.toLowerCase()) ?? Infinity) - (focusRank.get(right.focus.toLowerCase()) ?? Infinity))
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === user.fitnessGoal.trim().toLowerCase()
        ? `Recommended for your ${user.fitnessGoal} fitness goal.`
        : `Suggested based on your recent ${activityFocus.find(({ focus }) => focus === workout.focus.toLowerCase())?.type ?? workout.focus} activity.`,
    }));
}

export { User };
