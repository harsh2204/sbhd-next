-- Somebody Has Died Game Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_code VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'setup', 'playing', 'finished')),
  host_id UUID,
  estate_keeper_id UUID,
  current_round INTEGER DEFAULT 1,
  max_rounds INTEGER DEFAULT 4,
  current_player_turn INTEGER DEFAULT 0,
  deceased_name VARCHAR(255),
  deceased_identity VARCHAR(255),
  deceased_estate TEXT,
  game_settings JSONB DEFAULT '{}'::jsonb
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  is_estate_keeper BOOLEAN DEFAULT FALSE,
  is_ready BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  cards JSONB DEFAULT '{}'::jsonb,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game events table for real-time updates
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES players(id)
);

-- Card decks table
CREATE TABLE card_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  deck_type VARCHAR(20) NOT NULL CHECK (deck_type IN ('identity', 'relationship', 'backstory', 'objection')),
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  used_cards JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_games_game_code ON games(game_code);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_game_events_game_id ON game_events(game_id);
CREATE INDEX idx_game_events_created_at ON game_events(created_at);
CREATE INDEX idx_card_decks_game_id ON card_decks(game_id);

-- No RLS needed since anyone with game code should be able to access

-- Function to generate unique game codes
CREATE OR REPLACE FUNCTION generate_game_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  code VARCHAR(10);
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 6-character code using uppercase letters and numbers
    code := upper(substr(md5(random()::text), 1, 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM games WHERE game_code = code) INTO exists;
    
    IF NOT exists THEN
      RETURN code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically generate game codes
CREATE OR REPLACE FUNCTION set_game_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.game_code IS NULL OR NEW.game_code = '' THEN
    NEW.game_code := generate_game_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_game_code
  BEFORE INSERT ON games
  FOR EACH ROW
  EXECUTE FUNCTION set_game_code();

-- Function to initialize card decks for a new game
CREATE OR REPLACE FUNCTION initialize_card_decks(game_id UUID)
RETURNS VOID AS $$
DECLARE
  identity_cards JSONB := '[
    "The Family Patriarch/Matriarch", "The Black Sheep", "The Golden Child", "The Forgotten Middle Child",
    "The Family Rebel", "The Overachiever", "The Baby of the Family", "The Family Screw-up",
    "The Responsible One", "The Wild Child", "The Peacemaker", "The Drama Queen/King",
    "The Family Genius", "The Athletic Star", "The Artist", "The Workaholic",
    "Robot with Feelings", "Mafia Boss", "Failed Stand-up Comedian", "Professional Cat Lady/Man",
    "Conspiracy Theorist", "Mall Santa", "Renaissance Fair Enthusiast", "Disco Dancing Champion",
    "Professional Mourner", "Vampire (Allegedly)", "Time Traveler from 1987", "Retired Circus Performer",
    "Internet Influencer with 3 Followers", "Professional Couch Potato", "Paranormal Investigator", "Former Child Star"
  ]'::jsonb;
  
  relationship_cards JSONB := '[
    "Beloved Grandchild", "Favorite Niece/Nephew", "Loyal Spouse", "Devoted Child",
    "Trusted Friend", "Business Partner", "Caregiver", "Next-Door Neighbor",
    "Former Enemy Turned Friend", "Secret Lover", "Godchild", "Protégé",
    "Long-Lost Relative", "Family Doctor", "Spiritual Advisor", "Drinking Buddy",
    "Deceased''s Parole Officer", "You Killed Their Iguana", "Their Uber Driver", "Their WiFi Password Keeper",
    "Their Dealer (Prescription Only)", "Their Fake ID Creator", "Their Laugh Track", "Their Personal Stalker",
    "Their Embarrassing Dance Partner", "Their Nemesis", "Their Imaginary Friend", "Their Food Taster",
    "Their Emotional Support Human", "Their Ghost Writer", "Their Professional Mourner", "Their Evil Twin"
  ]'::jsonb;
  
  backstory_cards JSONB := '[
    "I was there when they took their first steps", "I helped them through their divorce",
    "I shared their secret hobby", "I was their emergency contact",
    "I have their embarrassing photos", "I know where they hid the money",
    "I was their partner in crime", "I nursed them when they were sick",
    "I never missed their birthday", "I saved their life once",
    "I completed their unfinished project", "I have their diary",
    "I was their designated driver", "I helped them cheat on their taxes",
    "I know their real age", "I was their alibi",
    "I taught them everything they know", "I was their biggest disappointment",
    "I was the only one who understood them", "I have their secret recipe",
    "I was their getaway driver", "I know about their secret family",
    "I was their confidant", "I helped them fake their death before",
    "I was their gambling partner", "I know their real name",
    "I was their wingman/wingwoman", "I helped them bury the evidence",
    "I was their taste tester", "I know their passwords",
    "I have a life-sized cutout of the deceased", "I''ve never been to Disneyland", "I Facebook stalked the person to my left",
    "I still have their toothbrush", "I taught them how to twerk", "I was their cryptocurrency advisor",
    "I helped them start their OnlyFans", "I know they''re not really dead", "I have their browser history",
    "I was their fake boyfriend/girlfriend at family events", "I helped them catfish someone online", "I know their Netflix password",
    "I was their accomplice in elaborate pranks", "I have their collection of belly button lint", "I know they once ate dog food",
    "I helped them escape from a mime convention", "I was their partner in a pyramid scheme", "I know their secret TikTok account",
    "I helped them fake a medical condition", "I was their designated Instagram photographer", "I know about their furry costume"
  ]'::jsonb;
  
  objection_cards JSONB := '[
    "OBJECTION: That''s hearsay!", "OBJECTION: Irrelevant to the will!",
    "OBJECTION: You''re lying under oath!", "OBJECTION: That''s not how inheritance works!",
    "OBJECTION: The deceased told me otherwise!", "OBJECTION: I have evidence to the contrary!",
    "OBJECTION: That''s illegal!", "OBJECTION: You can''t prove that!",
    "OBJECTION: The will says something different!", "OBJECTION: That violates their final wishes!",
    "OBJECTION: You''re twisting the truth!", "OBJECTION: That''s speculation!",
    "OBJECTION: I was there, that''s not what happened!", "OBJECTION: You''re out of order!",
    "OBJECTION: That''s not admissible evidence!", "OBJECTION: The statute of limitations has expired!",
    "OBJECTION: You''re faking that accent!", "OBJECTION: Your mouth is full of peanut butter!", "OBJECTION: You owe me ten bucks!",
    "OBJECTION: That''s not even a real word!", "OBJECTION: You''re making that up!", "OBJECTION: Your phone is ringing!",
    "OBJECTION: You smell like cheese!", "OBJECTION: That''s what she said!", "OBJECTION: You''re drunk!",
    "OBJECTION: Your zipper is down!", "OBJECTION: That''s not your real hair!", "OBJECTION: You''re lactose intolerant!",
    "OBJECTION: You still live with your mom!", "OBJECTION: You''re wearing two different shoes!", "OBJECTION: That''s literally impossible!",
    "OBJECTION: You forgot to wear pants!", "OBJECTION: Your argument is stupid!", "OBJECTION: Nobody asked you!"
  ]'::jsonb;
BEGIN
  INSERT INTO card_decks (game_id, deck_type, cards) VALUES
    (game_id, 'identity', identity_cards),
    (game_id, 'relationship', relationship_cards),
    (game_id, 'backstory', backstory_cards),
    (game_id, 'objection', objection_cards);
END;
$$ LANGUAGE plpgsql; 
