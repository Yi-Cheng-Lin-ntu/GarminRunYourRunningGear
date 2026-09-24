import { getSupabaseClient } from "./supabase.js";

export const DEMO_MODE = true;
export const DEMO_SEED_COUNTS = Object.freeze({ try: 360, watch: 300, pioneer: 340 });

const options = ["try", "watch", "pioneer"];
const demoCounts = { ...DEMO_SEED_COUNTS };

function validateOption(option) {
  if (!options.includes(option)) {
    throw new Error("無效的投票選項。");
  }
}

export async function getVoteCounts() {
  if (DEMO_MODE) {
    return { ...demoCounts };
  }

  const client = await getSupabaseClient();
  const results = await Promise.all(options.map((option) =>
    client.from("votes").select("id", { count: "exact", head: true }).eq("option", option)
  ));

  const failedResult = results.find((result) => result.error);
  if (failedResult) {
    throw failedResult.error;
  }

  return Object.fromEntries(options.map((option, index) => [option, results[index].count || 0]));
}

export async function submitVote(option) {
  validateOption(option);

  if (DEMO_MODE) {
    demoCounts[option] += 1;
    return;
  }

  const client = await getSupabaseClient();
  const { error } = await client.from("votes").insert({ option });
  if (error) {
    throw error;
  }
}

export async function subscribeToVotes(onInsert, onStatus) {
  if (DEMO_MODE) {
    onStatus("SUBSCRIBED");
    return () => {};
  }

  const client = await getSupabaseClient();
  const channel = client
    .channel("hydration-votes")
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "votes"
    }, (payload) => onInsert(payload.new))
    .subscribe(onStatus);

  return () => client.removeChannel(channel);
}