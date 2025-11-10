/**
 * LEAGUE OF LEGENDS YEAR-END RECAP - ALL-IN-ONE LAMBDA FUNCTION
 * 
 * This Lambda handles everything:
 * 1. Fetch player PUUID from Riot API
 * 2. Get match history (last 100 matches)
 * 3. Fetch detailed match data for each match
 * 4. Aggregate statistics (KDA, win rate, champion mastery, damage dealt, etc.)
 * 5. Generate AI-powered insights using Amazon Bedrock
 * 6. Return comprehensive year-end recap
 * 
 * Environment Variables Required:
 * - RIOT_API_KEY: Your Riot Games API key
 * - AWS region must have Bedrock enabled (us-east-1, us-west-2, etc.)
 */

const https = require('https');
const AWS = require('aws-sdk');

// Initialize AWS Bedrock client
const bedrock = new AWS.BedrockRuntime({ region: 'us-east-1' });

// Riot API Configuration
const RIOT_API_KEY = process.env.RIOT_API_KEY || 'RGAPI-59cac837-c14e-4a87-a9e2-41210e279f3b';
const RIOT_API_HEADERS = {
    'X-Riot-Token': RIOT_API_KEY,
    'Accept': 'application/json'
};

// Region routing mapping
const REGION_ROUTING = {
    'na1': 'americas',
    'br1': 'americas',
    'la1': 'americas',
    'la2': 'americas',
    'euw1': 'europe',
    'eun1': 'europe',
    'tr1': 'europe',
    'ru': 'europe',
    'kr': 'asia',
    'jp1': 'asia',
    'oc1': 'sea',
    'ph2': 'sea',
    'sg2': 'sea',
    'th2': 'sea',
    'tw2': 'sea',
    'vn2': 'sea'
};

// Champion ID to Name mapping (top 50 most played)
const CHAMPION_NAMES = {
    1: "Annie", 2: "Olaf", 3: "Galio", 4: "Twisted Fate", 5: "Xin Zhao",
    6: "Urgot", 7: "LeBlanc", 8: "Vladimir", 9: "Fiddlesticks", 10: "Kayle",
    11: "Master Yi", 12: "Alistar", 13: "Ryze", 14: "Sion", 15: "Sivir",
    16: "Soraka", 17: "Teemo", 18: "Tristana", 19: "Warwick", 20: "Nunu",
    21: "Miss Fortune", 22: "Ashe", 23: "Tryndamere", 24: "Jax", 25: "Morgana",
    26: "Zilean", 27: "Singed", 28: "Evelynn", 29: "Twitch", 30: "Karthus",
    31: "Cho'Gath", 32: "Amumu", 33: "Rammus", 34: "Anivia", 35: "Shaco",
    36: "Dr. Mundo", 37: "Sona", 38: "Kassadin", 39: "Irelia", 40: "Janna",
    41: "Gangplank", 42: "Corki", 43: "Karma", 44: "Taric", 45: "Veigar",
    48: "Trundle", 50: "Swain", 51: "Caitlyn", 53: "Blitzcrank", 54: "Malphite",
    55: "Katarina", 56: "Nocturne", 57: "Maokai", 58: "Renekton", 59: "Jarvan IV",
    60: "Elise", 61: "Orianna", 62: "Wukong", 63: "Brand", 64: "Lee Sin",
    67: "Vayne", 68: "Rumble", 69: "Cassiopeia", 72: "Skarner", 74: "Heimerdinger",
    75: "Nasus", 76: "Nidalee", 77: "Udyr", 78: "Poppy", 79: "Gragas",
    80: "Pantheon", 81: "Ezreal", 82: "Mordekaiser", 83: "Yorick", 84: "Akali",
    85: "Kennen", 86: "Garen", 89: "Leona", 90: "Malzahar", 91: "Talon",
    92: "Riven", 96: "Kog'Maw", 98: "Shen", 99: "Lux", 101: "Xerath",
    102: "Shyvana", 103: "Ahri", 104: "Graves", 105: "Fizz", 106: "Volibear",
    107: "Rengar", 110: "Varus", 111: "Nautilus", 112: "Viktor", 113: "Sejuani",
    114: "Fiora", 115: "Ziggs", 117: "Lulu", 119: "Draven", 120: "Hecarim",
    121: "Kha'Zix", 122: "Darius", 126: "Jayce", 127: "Lissandra", 131: "Diana",
    133: "Quinn", 134: "Syndra", 136: "Aurelion Sol", 141: "Kayn", 142: "Zoe",
    143: "Zyra", 145: "Kai'Sa", 147: "Seraphine", 150: "Gnar", 154: "Zac",
    157: "Yasuo", 161: "Vel'Koz", 163: "Taliyah", 164: "Camille", 166: "Akshan",
    201: "Braum", 202: "Jhin", 203: "Kindred", 221: "Zeri", 222: "Jinx",
    223: "Tahm Kench", 234: "Viego", 235: "Senna", 236: "Lucian", 238: "Zed",
    240: "Kled", 245: "Ekko", 246: "Qiyana", 254: "Vi", 266: "Aatrox",
    267: "Nami", 268: "Azir", 350: "Yuumi", 360: "Samira", 412: "Thresh",
    420: "Illaoi", 421: "Rek'Sai", 427: "Ivern", 429: "Kalista", 432: "Bard",
    497: "Rakan", 498: "Xayah", 516: "Ornn", 517: "Sylas", 518: "Neeko",
    523: "Aphelios", 526: "Rell", 555: "Pyke", 711: "Vex", 777: "Yone",
    875: "Sett", 876: "Lillia", 887: "Gwen", 888: "Renata Glasc", 895: "Nilah",
    897: "K'Sante", 902: "Milio", 910: "Hwei", 950: "Naafiri"
};

// Helper function to make HTTPS requests
function httpsRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

// Step 1: Get Player PUUID
async function getPlayerPuuid(gameName, tagLine, region) {
    const routingRegion = REGION_ROUTING[region] || 'americas';
    const options = {
        hostname: `${routingRegion}.api.riotgames.com`,
        path: `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        method: 'GET',
        headers: RIOT_API_HEADERS
    };
    
    console.log(`Fetching PUUID for ${gameName}#${tagLine} in region ${routingRegion}`);
    const data = await httpsRequest(options);
    return { puuid: data.puuid, gameName: data.gameName, tagLine: data.tagLine };
}

// Step 2: Get Match History (last 100 matches)
async function getMatchHistory(puuid, region, count = 100) {
    const routingRegion = REGION_ROUTING[region] || 'americas';
    const options = {
        hostname: `${routingRegion}.api.riotgames.com`,
        path: `/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`,
        method: 'GET',
        headers: RIOT_API_HEADERS
    };
    
    console.log(`Fetching match history for PUUID: ${puuid}`);
    const matchIds = await httpsRequest(options);
    return matchIds;
}

// Step 3: Fetch Match Details
async function getMatchDetails(matchId, region) {
    const routingRegion = REGION_ROUTING[region] || 'americas';
    const options = {
        hostname: `${routingRegion}.api.riotgames.com`,
        path: `/lol/match/v5/matches/${matchId}`,
        method: 'GET',
        headers: RIOT_API_HEADERS
    };
    
    console.log(`Fetching match details for: ${matchId}`);
    const matchData = await httpsRequest(options);
    return matchData;
}

// Step 4: Aggregate Statistics from All Matches
function aggregateStatistics(matchesData, targetPuuid) {
    const stats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        totalGoldEarned: 0,
        totalMinionsKilled: 0,
        totalVisionScore: 0,
        pentaKills: 0,
        quadraKills: 0,
        tripleKills: 0,
        doubleKills: 0,
        championStats: {},
        roleStats: { TOP: 0, JUNGLE: 0, MIDDLE: 0, BOTTOM: 0, UTILITY: 0 },
        firstBloods: 0,
        longestGame: 0,
        shortestGame: Infinity,
        totalGameTime: 0,
        matchHistory: []
    };

    for (const match of matchesData) {
        if (!match || !match.info || !match.info.participants) continue;

        const participant = match.info.participants.find(p => p.puuid === targetPuuid);
        if (!participant) continue;

        const gameDuration = match.info.gameDuration;
        const win = participant.win;
        const championId = participant.championId;
        const championName = CHAMPION_NAMES[championId] || `Champion${championId}`;
        const role = participant.teamPosition || participant.individualPosition || 'UNKNOWN';

        stats.totalGames++;
        if (win) stats.wins++; else stats.losses++;
        
        stats.kills += participant.kills || 0;
        stats.deaths += participant.deaths || 0;
        stats.assists += participant.assists || 0;
        stats.totalDamageDealt += participant.totalDamageDealtToChampions || 0;
        stats.totalDamageTaken += participant.totalDamageTaken || 0;
        stats.totalGoldEarned += participant.goldEarned || 0;
        stats.totalMinionsKilled += (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);
        stats.totalVisionScore += participant.visionScore || 0;
        
        stats.pentaKills += participant.pentaKills || 0;
        stats.quadraKills += participant.quadraKills || 0;
        stats.tripleKills += participant.tripleKills || 0;
        stats.doubleKills += participant.doubleKills || 0;
        
        if (participant.firstBloodKill) stats.firstBloods++;
        
        stats.longestGame = Math.max(stats.longestGame, gameDuration);
        stats.shortestGame = Math.min(stats.shortestGame, gameDuration);
        stats.totalGameTime += gameDuration;

        // Champion statistics
        if (!stats.championStats[championName]) {
            stats.championStats[championName] = {
                games: 0,
                wins: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
                damage: 0
            };
        }
        stats.championStats[championName].games++;
        if (win) stats.championStats[championName].wins++;
        stats.championStats[championName].kills += participant.kills || 0;
        stats.championStats[championName].deaths += participant.deaths || 0;
        stats.championStats[championName].assists += participant.assists || 0;
        stats.championStats[championName].damage += participant.totalDamageDealtToChampions || 0;

        // Role statistics
        if (role && stats.roleStats.hasOwnProperty(role)) {
            stats.roleStats[role]++;
        }

        // Match history summary
        stats.matchHistory.push({
            matchId: match.metadata.matchId,
            champion: championName,
            role: role,
            win: win,
            kda: `${participant.kills}/${participant.deaths}/${participant.assists}`,
            duration: Math.floor(gameDuration / 60),
            date: new Date(match.info.gameCreation).toISOString().split('T')[0]
        });
    }

    // Calculate averages and derived stats
    stats.winRate = stats.totalGames > 0 ? ((stats.wins / stats.totalGames) * 100).toFixed(2) : 0;
    stats.kda = stats.deaths > 0 ? ((stats.kills + stats.assists) / stats.deaths).toFixed(2) : (stats.kills + stats.assists).toFixed(2);
    stats.avgKills = stats.totalGames > 0 ? (stats.kills / stats.totalGames).toFixed(1) : 0;
    stats.avgDeaths = stats.totalGames > 0 ? (stats.deaths / stats.totalGames).toFixed(1) : 0;
    stats.avgAssists = stats.totalGames > 0 ? (stats.assists / stats.totalGames).toFixed(1) : 0;
    stats.avgDamage = stats.totalGames > 0 ? Math.floor(stats.totalDamageDealt / stats.totalGames) : 0;
    stats.avgGold = stats.totalGames > 0 ? Math.floor(stats.totalGoldEarned / stats.totalGames) : 0;
    stats.avgCS = stats.totalGames > 0 ? Math.floor(stats.totalMinionsKilled / stats.totalGames) : 0;
    stats.avgVision = stats.totalGames > 0 ? Math.floor(stats.totalVisionScore / stats.totalGames) : 0;
    stats.avgGameTime = stats.totalGames > 0 ? Math.floor(stats.totalGameTime / stats.totalGames / 60) : 0;

    // Top 5 most played champions
    stats.topChampions = Object.entries(stats.championStats)
        .sort((a, b) => b[1].games - a[1].games)
        .slice(0, 5)
        .map(([name, data]) => ({
            name,
            games: data.games,
            wins: data.wins,
            winRate: data.games > 0 ? ((data.wins / data.games) * 100).toFixed(1) : 0,
            avgKDA: data.deaths > 0 ? ((data.kills + data.assists) / data.deaths).toFixed(2) : (data.kills + data.assists).toFixed(2),
            avgDamage: data.games > 0 ? Math.floor(data.damage / data.games) : 0
        }));

    // Favorite role
    stats.favoriteRole = Object.entries(stats.roleStats)
        .sort((a, b) => b[1] - a[1])[0][0];

    // === TIME-SERIES ANALYSIS ===
    // Sort matches by date (oldest first)
    stats.matchHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Group matches by month for trend analysis
    const monthlyStats = {};
    stats.matchHistory.forEach((match, index) => {
        const monthKey = match.date.substring(0, 7); // YYYY-MM format
        if (!monthlyStats[monthKey]) {
            monthlyStats[monthKey] = {
                games: 0,
                wins: 0,
                kills: 0,
                deaths: 0,
                assists: 0
            };
        }
        monthlyStats[monthKey].games++;
        if (match.win) monthlyStats[monthKey].wins++;
        
        const kdaParts = match.kda.split('/').map(x => parseInt(x));
        monthlyStats[monthKey].kills += kdaParts[0];
        monthlyStats[monthKey].deaths += kdaParts[1];
        monthlyStats[monthKey].assists += kdaParts[2];
    });
    
    // Calculate monthly trends
    stats.monthlyTrends = Object.entries(monthlyStats).map(([month, data]) => ({
        month,
        games: data.games,
        winRate: ((data.wins / data.games) * 100).toFixed(1),
        kda: data.deaths > 0 ? ((data.kills + data.assists) / data.deaths).toFixed(2) : (data.kills + data.assists).toFixed(2)
    }));

    // === EARLY VS LATE COMPARISON (Growth Analysis) ===
    const totalMatches = stats.matchHistory.length;
    const splitPoint = Math.floor(totalMatches * 0.2); // First 20% vs Last 20%
    
    const earlyMatches = stats.matchHistory.slice(0, splitPoint);
    const lateMatches = stats.matchHistory.slice(-splitPoint);
    
    const calculatePeriodStats = (matches) => {
        const periodStats = {
            games: matches.length,
            wins: 0,
            kills: 0,
            deaths: 0,
            assists: 0
        };
        
        matches.forEach(match => {
            if (match.win) periodStats.wins++;
            const kdaParts = match.kda.split('/').map(x => parseInt(x));
            periodStats.kills += kdaParts[0];
            periodStats.deaths += kdaParts[1];
            periodStats.assists += kdaParts[2];
        });
        
        return {
            games: periodStats.games,
            winRate: periodStats.games > 0 ? ((periodStats.wins / periodStats.games) * 100).toFixed(1) : 0,
            kda: periodStats.deaths > 0 ? ((periodStats.kills + periodStats.assists) / periodStats.deaths).toFixed(2) : 0,
            avgKills: periodStats.games > 0 ? (periodStats.kills / periodStats.games).toFixed(1) : 0,
            avgDeaths: periodStats.games > 0 ? (periodStats.deaths / periodStats.games).toFixed(1) : 0,
            avgAssists: periodStats.games > 0 ? (periodStats.assists / periodStats.games).toFixed(1) : 0
        };
    };
    
    stats.earlySeasonStats = calculatePeriodStats(earlyMatches);
    stats.lateSeasonStats = calculatePeriodStats(lateMatches);
    
    // Calculate growth deltas
    stats.growthAnalysis = {
        winRateDelta: (stats.lateSeasonStats.winRate - stats.earlySeasonStats.winRate).toFixed(1),
        kdaDelta: (stats.lateSeasonStats.kda - stats.earlySeasonStats.kda).toFixed(2),
        killsDelta: (stats.lateSeasonStats.avgKills - stats.earlySeasonStats.avgKills).toFixed(1),
        deathsDelta: (stats.lateSeasonStats.avgDeaths - stats.earlySeasonStats.avgDeaths).toFixed(1),
        assistsDelta: (stats.lateSeasonStats.avgAssists - stats.earlySeasonStats.avgAssists).toFixed(1)
    };

    // === CHAMPION POOL DIVERSITY ===
    const uniqueChampions = Object.keys(stats.championStats).length;
    const totalGamesPlayed = stats.totalGames;
    
    // Calculate champion diversity score (0-100)
    // Higher score = more diverse champion pool
    const championDistribution = Object.values(stats.championStats).map(c => c.games);
    const maxGamesOnChamp = Math.max(...championDistribution);
    const diversityScore = Math.min(100, (uniqueChampions * 5) - (maxGamesOnChamp / totalGamesPlayed * 50) + 50);
    
    stats.championPoolDiversity = {
        uniqueChampions,
        diversityScore: Math.max(0, diversityScore.toFixed(0)),
        mostPlayedChampGames: maxGamesOnChamp,
        mostPlayedChampPercentage: ((maxGamesOnChamp / totalGamesPlayed) * 100).toFixed(1)
    };

    // === ROLE FLEXIBILITY ===
    const rolesPlayed = Object.entries(stats.roleStats).filter(([_, count]) => count > 0).length;
    const mainRolePercentage = ((stats.roleStats[stats.favoriteRole] / totalGamesPlayed) * 100).toFixed(1);
    
    stats.roleFlexibility = {
        rolesPlayed,
        mainRolePercentage,
        flexibilityScore: rolesPlayed * 20 - (mainRolePercentage * 0.5) // 0-100 scale
    };

    // === PERFORMANCE TRENDS ===
    // Calculate if player is improving, declining, or stable
    const recentGames = stats.matchHistory.slice(-20);
    const recentWinRate = (recentGames.filter(m => m.win).length / recentGames.length * 100).toFixed(1);
    
    let trendDirection = 'stable';
    if (stats.growthAnalysis.winRateDelta > 5) trendDirection = 'improving';
    else if (stats.growthAnalysis.winRateDelta < -5) trendDirection = 'declining';
    
    stats.performanceTrend = {
        direction: trendDirection,
        recentWinRate,
        overall: stats.winRate,
        momentum: recentWinRate - stats.winRate
    };

    return stats;
}

// Step 5: Generate AI Insights using Amazon Bedrock
async function generateAIInsights(stats, playerInfo) {
    const prompt = `You are an expert League of Legends analyst and storyteller creating an EPIC year-end recap for ${playerInfo.gameName}#${playerInfo.tagLine}. This should feel like a Spotify Wrapped or Netflix Year in Review - engaging, personal, and shareable!

📊 COMPLETE PLAYER STATISTICS:

OVERALL PERFORMANCE:
- Total Games: ${stats.totalGames} | Win Rate: ${stats.winRate}%
- Overall KDA: ${stats.kda} (${stats.avgKills}/${stats.avgDeaths}/${stats.avgAssists})
- Avg Damage: ${stats.avgDamage.toLocaleString()} | Avg Gold: ${stats.avgGold.toLocaleString()}
- Avg CS: ${stats.avgCS} | Vision Score: ${stats.avgVision}

LEGENDARY MOMENTS:
- Pentakills: ${stats.pentaKills} | Quadrakills: ${stats.quadraKills} | Triple Kills: ${stats.tripleKills}
- First Bloods: ${stats.firstBloods}

CHAMPION MASTERY:
- Top Champions: ${stats.topChampions.map(c => `${c.name} (${c.games} games, ${c.winRate}% WR, ${c.avgKDA} KDA)`).join(' | ')}
- Champion Pool Diversity: ${stats.championPoolDiversity.uniqueChampions} unique champions
- Diversity Score: ${stats.championPoolDiversity.diversityScore}/100
- Most Played: ${stats.topChampions[0].name} (${stats.championPoolDiversity.mostPlayedChampPercentage}% of games)

ROLE IDENTITY:
- Main Role: ${stats.favoriteRole} (${stats.roleFlexibility.mainRolePercentage}% of games)
- Total Roles Played: ${stats.roleFlexibility.rolesPlayed}
- Flexibility Score: ${stats.roleFlexibility.flexibilityScore.toFixed(0)}/100

🚀 GROWTH & EVOLUTION:
Early Season (First ${stats.earlySeasonStats.games} Games):
- Win Rate: ${stats.earlySeasonStats.winRate}% | KDA: ${stats.earlySeasonStats.kda}
- Avg K/D/A: ${stats.earlySeasonStats.avgKills}/${stats.earlySeasonStats.avgDeaths}/${stats.earlySeasonStats.avgAssists}

Late Season (Last ${stats.lateSeasonStats.games} Games):
- Win Rate: ${stats.lateSeasonStats.winRate}% | KDA: ${stats.lateSeasonStats.kda}
- Avg K/D/A: ${stats.lateSeasonStats.avgKills}/${stats.lateSeasonStats.avgDeaths}/${stats.lateSeasonStats.avgAssists}

GROWTH METRICS:
- Win Rate Change: ${stats.growthAnalysis.winRateDelta > 0 ? '+' : ''}${stats.growthAnalysis.winRateDelta}%
- KDA Improvement: ${stats.growthAnalysis.kdaDelta > 0 ? '+' : ''}${stats.growthAnalysis.kdaDelta}
- Kill Trend: ${stats.growthAnalysis.killsDelta > 0 ? '+' : ''}${stats.growthAnalysis.killsDelta}
- Death Trend: ${stats.growthAnalysis.deathsDelta > 0 ? '+' : ''}${stats.growthAnalysis.deathsDelta}
- Performance Trend: ${stats.performanceTrend.direction.toUpperCase()}

📈 TIMELINE & PATTERNS:
${stats.monthlyTrends.length > 0 ? stats.monthlyTrends.map(m => `${m.month}: ${m.games} games, ${m.winRate}% WR, ${m.kda} KDA`).join('\n') : 'No timeline data'}

Create an AMAZING year-end story with these sections:

1. 🎮 EPIC TITLE: Create a personalized, memorable headline that captures their year

2. 📖 YOUR STORY: Tell their League journey as a narrative - how they started, evolved, and where they are now (use the growth metrics!)

3. 🎯 PLAYSTYLE IDENTITY: Based on ALL the data, identify their unique playstyle:
   - Are they an aggressive carry? Strategic support? Consistent farmer?
   - What makes them unique? (Look at their damage, CS, vision, KDA patterns)
   - Champion pool diversity tells a story - are they a one-trick or flex player?
   
4. 🌟 SIGNATURE MOMENTS: Highlight their most impressive achievements
   - Call out pentakills, winstreaks, mastery
   - Make them feel legendary!

5. 📊 META AWARENESS: Comment on their champion choices and adaptation
   - Do they stick to comfort picks or adapt to meta?
   - Role flexibility insights

6. 💡 COACHING CORNER: Provide 3-4 specific, actionable tips based on their weak points:
   - If deaths are high, suggest warding/positioning
   - If CS is low, suggest farming drills
   - If win rate declining, address specific patterns
   - Use their growth data to show what's working vs not working

7. 🎊 CELEBRATION: End with hype and motivation for next season

Make it personal, make it fun, make it SHAREABLE! Use emojis, be creative with language, and make them feel proud of their year. This should be something they want to screenshot and share with friends.

IMPORTANT: Keep it conversational and engaging - this is NOT a formal report. Think Spotify Wrapped energy! Max 600 words.`;

    const bedrockParams = {
        modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7
        })
    };

    try {
        console.log('Generating AI insights with Amazon Bedrock...');
        const response = await bedrock.invokeModel(bedrockParams).promise();
        const responseBody = JSON.parse(response.body.toString());
        const insights = responseBody.content[0].text;
        return insights;
    } catch (error) {
        console.error('Bedrock error:', error);
        // Fallback to basic insights if Bedrock fails
        return generateBasicInsights(stats, playerInfo);
    }
}

// Fallback function for basic insights (if Bedrock is unavailable)
function generateBasicInsights(stats, playerInfo) {
    const insights = [];
    
    insights.push(`🎮 ${playerInfo.gameName}'s Year in Review 🎮\n`);
    insights.push(`You played ${stats.totalGames} games with a ${stats.winRate}% win rate!`);
    
    if (stats.winRate >= 60) {
        insights.push(`🔥 Outstanding win rate! You're crushing it on the Rift!`);
    } else if (stats.winRate >= 50) {
        insights.push(`⚖️ Balanced gameplay - you're holding your own!`);
    } else {
        insights.push(`💪 Room to grow - keep learning and improving!`);
    }
    
    insights.push(`\n📊 Key Stats:`);
    insights.push(`- KDA: ${stats.kda} (${stats.avgKills}/${stats.avgDeaths}/${stats.avgAssists})`);
    insights.push(`- Favorite Role: ${stats.favoriteRole}`);
    insights.push(`- Average Damage: ${stats.avgDamage.toLocaleString()}`);
    
    if (stats.pentaKills > 0) {
        insights.push(`\n🌟 LEGENDARY! You got ${stats.pentaKills} PENTAKILL${stats.pentaKills > 1 ? 'S' : ''}!`);
    }
    
    insights.push(`\n🏆 Top Champions:`);
    stats.topChampions.forEach((champ, i) => {
        insights.push(`${i + 1}. ${champ.name} - ${champ.games} games (${champ.winRate}% WR, ${champ.avgKDA} KDA)`);
    });
    
    insights.push(`\n✨ Keep playing, keep improving, and see you on the Rift in the new season!`);
    
    return insights.join('\n');
}

// Main Lambda Handler
exports.handler = async (event, context) => {
    console.log('League of Legends Recap Lambda Started');
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        // Parse input
        let body;
        if (event.body) {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } else {
            body = event;
        }

        const { game_name, tag_line, region = 'na1', match_count = 100 } = body;

        // Validate inputs
        if (!game_name || !tag_line) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'Missing required parameters: game_name and tag_line'
                })
            };
        }

        if (!RIOT_API_KEY) {
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    error: 'RIOT_API_KEY not configured'
                })
            };
        }

        // Step 1: Get player PUUID
        console.log('Step 1: Fetching player PUUID...');
        const playerInfo = await getPlayerPuuid(game_name, tag_line, region);
        console.log(`Found player: ${playerInfo.gameName}#${playerInfo.tagLine} (${playerInfo.puuid})`);

        // Step 2: Get match history
        console.log('Step 2: Fetching match history...');
        const matchIds = await getMatchHistory(playerInfo.puuid, region, Math.min(match_count, 100));
        console.log(`Found ${matchIds.length} matches`);

        if (matchIds.length === 0) {
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    message: 'No matches found for this player',
                    playerInfo
                })
            };
        }

        // Step 3: Fetch match details (with rate limiting - batch of 20 at a time)
        console.log('Step 3: Fetching match details...');
        const matchesData = [];
        const batchSize = 20;
        
        for (let i = 0; i < matchIds.length; i += batchSize) {
            const batch = matchIds.slice(i, i + batchSize);
            const batchPromises = batch.map(matchId => 
                getMatchDetails(matchId, region).catch(err => {
                    console.error(`Failed to fetch match ${matchId}:`, err.message);
                    return null;
                })
            );
            const batchResults = await Promise.all(batchPromises);
            matchesData.push(...batchResults.filter(m => m !== null));
            
            // Small delay between batches to respect rate limits
            if (i + batchSize < matchIds.length) {
                await new Promise(resolve => setTimeout(resolve, 1200));
            }
        }

        console.log(`Successfully fetched ${matchesData.length} match details`);

        // Step 4: Aggregate statistics
        console.log('Step 4: Aggregating statistics...');
        const stats = aggregateStatistics(matchesData, playerInfo.puuid);

        // Step 5: Generate AI insights
        console.log('Step 5: Generating AI insights...');
        const insights = await generateAIInsights(stats, playerInfo);

        // Build final recap
        const recap = {
            gameName: playerInfo.gameName,
            tagLine: playerInfo.tagLine,
            totalGames: stats.totalGames,
            winRate: stats.winRate,
            kda: stats.kda,
            favoriteRole: stats.favoriteRole,
            playerInfo: {
                gameName: playerInfo.gameName,
                tagLine: playerInfo.tagLine,
                puuid: playerInfo.puuid,
                region: region
            },
            statistics: {
                overview: {
                    totalGames: stats.totalGames,
                    wins: stats.wins,
                    losses: stats.losses,
                    winRate: stats.winRate + '%',
                    kda: stats.kda,
                    averages: {
                        kills: stats.avgKills,
                        deaths: stats.avgDeaths,
                        assists: stats.avgAssists,
                        damage: stats.avgDamage,
                        gold: stats.avgGold,
                        cs: stats.avgCS,
                        visionScore: stats.avgVision,
                        gameTime: stats.avgGameTime + ' minutes'
                    }
                },
                highlights: {
                    pentaKills: stats.pentaKills,
                    quadraKills: stats.quadraKills,
                    tripleKills: stats.tripleKills,
                    doubleKills: stats.doubleKills,
                    firstBloods: stats.firstBloods,
                    longestGame: Math.floor(stats.longestGame / 60) + ' minutes',
                    shortestGame: Math.floor(stats.shortestGame / 60) + ' minutes'
                },
                topChampions: stats.topChampions,
                roleDistribution: stats.roleStats,
                favoriteRole: stats.favoriteRole,
                recentMatches: stats.matchHistory.slice(0, 10),
                monthlyTrends: stats.monthlyTrends,
                earlySeasonStats: stats.earlySeasonStats,
                lateSeasonStats: stats.lateSeasonStats,
                growthAnalysis: stats.growthAnalysis,
                championPoolDiversity: stats.championPoolDiversity,
                roleFlexibility: stats.roleFlexibility,
                performanceTrend: stats.performanceTrend
            },
            aiInsights: insights,
            matchesAnalyzed: matchesData.length,
            generatedAt: new Date().toISOString()
        };

        console.log('Recap generation complete!');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify(recap)
        };

    } catch (error) {
        console.error('Error generating recap:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Failed to generate recap',
                message: error.message,
                stack: error.stack
            })
        };
    }
};
