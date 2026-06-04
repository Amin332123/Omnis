import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/omnis_studio?schema=public";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();

  // Fetch users
  const usersRes = await client.query("SELECT id, email, credits FROM users");
  const users = usersRes.rows;

  // Fetch jobs
  const jobsRes = await client.query("SELECT id, user_id, type, model, credits_used, created_at FROM generation_jobs");
  const jobs = jobsRes.rows;

  await client.end();

  // Model-to-API-Cost mapping in USD
  const getApiCost = (type, model, creditsUsed) => {
    if (type === 'image') {
      const lowerModel = model.toLowerCase();
      if (lowerModel.includes('schnell') || lowerModel === 'fast') {
        return 0.003;
      }
      if (lowerModel.includes('dev') || lowerModel === 'premium') {
        return 0.025;
      }
      if (lowerModel.includes('pro')) {
        return 0.050;
      }
      if (lowerModel.includes('mini')) {
        return 0.015;
      }
      if (lowerModel.includes('gpt-image-1') || lowerModel.includes('gpt-image-1.5')) {
        return 0.040;
      }
      if (lowerModel.includes('gpt-image-2')) {
        return 0.040;
      }
      return 0.025; // default fallback
    } else if (type === 'video') {
      // Map based on credits used
      if (creditsUsed <= 8) return 0.25; // 5s 720p Fast ($0.05/sec)
      if (creditsUsed <= 11) return 0.75; // 5s 1080p Fast ($0.15/sec)
      if (creditsUsed <= 15) return 0.45; // average (Fast 10s $0.50 vs Premium 5s $0.40)
      if (creditsUsed <= 23) return 1.15; // average (Fast 15s $0.75, Fast 10s 1080p $1.50, Premium 5s 1080p $1.25)
      if (creditsUsed <= 30) return 0.80; // Premium 10s 720p ($0.08/sec)
      if (creditsUsed <= 34) return 2.25; // Fast 15s 1080p ($0.15/sec)
      if (creditsUsed <= 45) return 1.85; // average (Premium 15s 720p $1.20 vs Premium 10s 1080p $2.50)
      if (creditsUsed <= 68) return 3.75; // Premium 15s 1080p ($0.25/sec)
      return creditsUsed * 0.05; // generic fallback
    }
    return 0;
  };

  const results = [];
  for (const user of users) {
    const userJobs = jobs.filter(j => j.user_id === user.id);
    const totalCreditsUsed = userJobs.reduce((sum, j) => sum + parseFloat(j.credits_used), 0);
    const creditsRemaining = parseFloat(user.credits);
    const totalAcquired = totalCreditsUsed + creditsRemaining;

    // Deduct 10 free credits to find purchased credits
    const purchasedCredits = Math.max(0, totalAcquired - 10);

    // Calculate revenue using the pack pricing structure
    let revenue = 0;
    let packName = "Free Tier";
    if (purchasedCredits > 0) {
      if (purchasedCredits <= 100) {
        revenue = purchasedCredits * 0.29; // Starter Pack price level ($0.29/credit)
        packName = "Starter Pack";
      } else if (purchasedCredits <= 350) {
        revenue = purchasedCredits * 0.226; // Pro Pack price level ($0.226/credit)
        packName = "Pro Pack";
      } else {
        revenue = purchasedCredits * 0.186; // Pro Max Pack price level ($0.186/credit)
        packName = "Pro Max Pack";
      }
    }

    // Calculate actual API costs
    let totalApiCost = 0;
    for (const job of userJobs) {
      const cost = getApiCost(job.type, job.model, parseFloat(job.credits_used));
      totalApiCost += cost;
    }

    const netProfit = revenue - totalApiCost;
    const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    results.push({
      email: user.email,
      creditsRemaining,
      totalCreditsUsed,
      purchasedCredits,
      packName,
      revenue,
      totalApiCost,
      netProfit,
      margin,
      jobsCount: userJobs.length
    });
  }

  // Filter users with activity or purchases
  const activeResults = results.filter(r => r.jobsCount > 0 || r.purchasedCredits > 0);

  console.log(JSON.stringify(activeResults, null, 2));
}

run().catch(console.error);
