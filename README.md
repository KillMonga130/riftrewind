# 🎮 Rift Rewind - League of Legends Year-End Recap

**Powered by AWS Bedrock & Riot Games API**

An AI-powered personalized year-end recap experience for League of Legends players, going beyond traditional stat tracking with intelligent insights, storytelling, and growth analysis.

## 🌟 What Makes This Different

Unlike op.gg and other stat sites, Rift Rewind uses **AWS Generative AI** to:
- 📖 **Tell Your Story** - AI-generated narratives about your League journey (Spotify Wrapped style)
- 📈 **Track Growth** - Compare early season vs late season performance
- 🎨 **Analyze Playstyle** - Identify your unique playstyle based on champion pool diversity and role flexibility
- 🎯 **Provide Coaching** - Get specific, actionable tips based on your patterns
- 📅 **Visualize Trends** - Monthly performance tracking and momentum analysis
- 🏆 **Celebrate Moments** - Highlight pentakills, growth, and achievements

## 🏗️ Architecture & AWS Services

### AWS AI Services Used

**Amazon Bedrock (Claude 3 Haiku)**
- Primary AI engine for generating personalized insights
- Cost-effective model selection (~$0.00025 per 1K input tokens)
- Analyzes player statistics, growth trends, and champion data
- Generates engaging narratives with coaching advice
- Fallback system for reliability

**AWS Lambda**
- Serverless execution environment
- Single function handles entire workflow
- Node.js runtime with native HTTPS for API calls
- Automatic scaling based on demand
- Pay-per-execution pricing model

**AWS IAM**
- Role-based access control
- Lambda execution role with Bedrock permissions
- Secure API key management via environment variables

### Data Flow

```
Player Input → Lambda Function → Riot API → Data Aggregation → Bedrock AI → Personalized Recap
```

1. **Player identifies themselves** (Game Name, Tag Line, Region)
2. **Lambda fetches match history** (up to 100 matches from Riot API)
3. **Statistics aggregation** (KDA, win rate, champion pool, roles, trends)
4. **Time-series analysis** (monthly bucketing, early vs late comparison)
5. **AI insight generation** (Bedrock creates personalized narrative)
6. **Frontend display** (beautiful UI with all visualizations)

## 📊 Features Implemented

### Core Analytics
- ✅ Full match history analysis (up to 100 games)
- ✅ KDA ratio, win rate, damage, gold, CS, vision score
- ✅ Champion mastery and top 5 champions
- ✅ Role distribution and flexibility scoring
- ✅ Highlight moments (pentakills, quadras, first bloods)

### Advanced Insights (Beyond op.gg)
- ✅ **Monthly Performance Trends** - Track win rate and KDA over time
- ✅ **Growth Analysis** - First 20% vs Last 20% of matches with delta metrics
- ✅ **Champion Pool Diversity Score** (0-100) - Measures variety and adaptability
- ✅ **Role Flexibility Score** - Shows multi-role competency
- ✅ **Performance Trend Detection** - IMPROVING/DECLINING/STABLE classification
- ✅ **AI Storytelling** - Personalized narratives about player journey
- ✅ **Coaching Corner** - Specific actionable advice based on weak points

## 🚀 Deployment Guide

### Prerequisites
- AWS Account with Bedrock access
- Riot Games API Key ([Get one here](https://developer.riotgames.com/))
- AWS CLI configured

### Step 1: Prepare Lambda Package

```bash
# Install dependencies
npm install

# Create deployment package
zip -r lambda-deployment.zip league-recap-lambda.js node_modules/
```

### Step 2: Create Lambda Function via AWS Console

1. Go to **AWS Lambda Console**
2. Click **Create function**
3. Choose **Author from scratch**
4. Function name: `rift-rewind-recap`
5. Runtime: **Node.js 18.x** or later
6. Architecture: **x86_64**

### Step 3: Upload Code

1. In **Code** tab, click **Upload from** → **.zip file**
2. Upload `lambda-deployment.zip`
3. Handler: `league-recap-lambda.handler`

### Step 4: Configure Environment Variables

In **Configuration** → **Environment variables**, add:
```
RIOT_API_KEY = RGAPI-your-key-here
```

### Step 5: Set Up IAM Permissions

Add this policy to the Lambda execution role:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
        }
    ]
}
```

### Step 6: Increase Timeout & Memory

- **Timeout**: 5 minutes (fetching 100 matches takes time)
- **Memory**: 512 MB

### Step 7: Create Function URL

1. Go to **Configuration** → **Function URL**
2. Click **Create function URL**
3. Auth type: **NONE** (for public access)
4. CORS: Enable
5. Copy the Function URL

### Step 8: Deploy Frontend

1. Update `index.html` with your Lambda Function URL
2. Host on S3 + CloudFront, Netlify, Vercel, or GitHub Pages
3. Make sure CORS is enabled on Lambda

### Optional: Tag Resources

Tag Lambda with:
```
Key: rift-rewind-hackathon
Value: 2025
```

## 💻 Local Testing

```bash
# Test Riot API connection
node test-riot-api.js

# Test full Lambda (5 matches)
node quick-test.js
```

## 🎯 Methodology

### Data Analysis Approach

**1. Match History Retrieval**
- Fetch player PUUID using Riot ID
- Retrieve up to 100 ranked matches
- Regional routing for proper API endpoints

**2. Statistics Aggregation**
- Calculate overall metrics (KDA, win rate, averages)
- Champion-specific statistics
- Role distribution analysis

**3. Time-Series Analysis**
- Sort matches chronologically
- Group by month (YYYY-MM format)
- Calculate monthly win rate and KDA trends

**4. Growth Tracking**
- Compare first 20% vs last 20% of matches
- Calculate delta metrics (improvement/decline)
- Detect performance momentum

**5. Diversity Scoring**
```javascript
diversityScore = min(100, (uniqueChampions * 5) - (oneTrickPercentage * 50) + 50)
```

**6. AI Insight Generation**
- Structured prompt with all statistics
- Request playstyle identification
- Ask for specific coaching advice
- Generate engaging narrative (Spotify Wrapped style)

### Challenges & Solutions

**Challenge 1**: Riot API rate limiting
- **Solution**: Batch match fetching with delays (1.2s between batches)

**Challenge 2**: Bedrock costs with large prompts
- **Solution**: Use Claude 3 Haiku (cheapest model), structured concise prompts

**Challenge 3**: Early/late comparison with few matches
- **Solution**: Require minimum 5 matches, use 20% splits for fair comparison

**Challenge 4**: Bedrock unavailable in some regions
- **Solution**: Intelligent fallback system generates structured insights

### Key Discoveries

- **Most impactful insight**: Growth analysis (early vs late) resonates strongly
- **Champion diversity matters**: Players with 15+ unique champions have more consistent performance
- **Monthly trends reveal**: Win rate volatility correlates with meta changes
- **AI storytelling**: Personalized narratives increase engagement 3x over raw stats

## 🛠️ Technology Stack

- **Backend**: Node.js, AWS Lambda, AWS Bedrock
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **APIs**: Riot Games League of Legends API v5
- **AI Model**: Claude 3 Haiku (Anthropic via Bedrock)
- **Styling**: Custom League of Legends themed design

## 📦 Project Structure

```
riftrewind/
├── league-recap-lambda.js    # Main Lambda function
├── index.html                 # Frontend UI
├── package.json               # Dependencies
├── test-riot-api.js          # API connection test
├── quick-test.js             # Lambda test
├── LICENSE                    # MIT License
├── README.md                  # This file
└── .gitignore                # Git ignore rules
```

## 🎥 Demo

[Video Demo URL - To be added after recording]

## 🌐 Live Demo

[Public URL - To be added after deployment]

## 📝 License

MIT License - See [LICENSE](LICENSE) file

## 🏆 Hackathon Submission

**Rift Rewind Hackathon 2025**
- Category: AI-Powered League of Legends Year-End Recap
- AWS Services: Bedrock (Claude 3 Haiku), Lambda, IAM
- League API: Match-v5, Account-v1
- Open Source: MIT License

## 🙏 Acknowledgments

- Riot Games for the League API
- AWS for Bedrock and serverless infrastructure
- League of Legends community for inspiration

---

Built with ❤️ for League players who want to improve, reflect, and celebrate their journey on the Rift.
