import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ENVIRONMENTAL_TOPICS = [
  {
    trigger: 'pollution',
    tips: [
      'Did you know that plastic pollution affects over 700 marine species?',
      'Air pollution causes 7 million premature deaths annually worldwide.',
      'Microplastics have been found in human blood and organs.'
    ]
  },
  {
    trigger: 'recycling',
    tips: [
      'Recycling one aluminum can saves enough energy to power a TV for 3 hours!',
      'Glass can be recycled endlessly without losing quality.',
      'Recycling paper saves 60% of the energy needed to make new paper.'
    ]
  },
  {
    trigger: 'energy',
    tips: [
      'Solar panels can generate electricity for 25+ years!',
      'LED bulbs use 75% less energy than incandescent bulbs.',
      'Wind power could supply 20 times the world\'s current electricity needs.'
    ]
  },
  {
    trigger: 'forests',
    tips: [
      'Trees absorb 48 pounds of CO2 per year and release oxygen for 2 people daily.',
      'Forests are home to 80% of terrestrial biodiversity.',
      'Deforestation accounts for 10% of global CO2 emissions.'
    ]
  },
  {
    trigger: 'water',
    tips: [
      'Only 3% of Earth\'s water is fresh, and 70% of that is frozen.',
      'A dripping faucet wastes over 3,000 gallons per year.',
      'It takes 1,800 gallons of water to produce a single pair of jeans!'
    ]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, score, gameEvent } = await req.json();

    let prompt = '';
    let systemMessage = `You are Eco, a friendly environmental teacher in an educational game. Your role is to provide short, engaging, and informative environmental tips. Keep responses under 100 words and always end with an encouraging phrase about environmental action.`;

    if (action === 'welcome') {
      prompt = 'Welcome the player to the eco-adventure game and briefly explain your role as their environmental guide.';
    } else if (action === 'score_milestone') {
      const milestone = Math.floor(score / 50) * 50;
      prompt = `The player just reached ${score} points! Give them an encouraging environmental tip related to their achievement.`;
    } else if (action === 'random_tip') {
      const randomTopic = ENVIRONMENTAL_TOPICS[Math.floor(Math.random() * ENVIRONMENTAL_TOPICS.length)];
      const randomTip = randomTopic.tips[Math.floor(Math.random() * randomTopic.tips.length)];
      prompt = `Share this environmental fact: "${randomTip}" in an engaging way that connects to the game.`;
    } else if (action === 'collection_tip') {
      prompt = `The player just collected an environmental item! Give a short tip about ${gameEvent || 'environmental conservation'}.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const message = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      message,
      character: 'eco-teacher',
      timestamp: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in eco-teacher function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      message: 'Hi there! I\'m having trouble connecting right now, but remember: every small action counts for our planet! 🌱'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});