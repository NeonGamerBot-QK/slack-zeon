# Discord Portability Analysis for slack-zeon

**Analysis Date:** November 15, 2025  
**Purpose:** Identify which features are Slack-specific vs. generic and could be ported to Discord

## Executive Summary

This analysis categorizes all commands and modules in the slack-zeon codebase based on their portability to Discord. Features are classified as either:
- **Generic** - Can be ported to Discord with varying levels of effort
- **Slack-only** - Tied to Slack-specific APIs or Hack Club integrations

### Key Findings

- **~40% of features are portable** to Discord with Easy to Medium effort
- **~60% are Slack-only**, primarily due to:
  - Hack Club service integrations (hackclub.com domains)
  - Slack-specific APIs (App Home, channel management, analytics)
  - Hard-coded Slack channel IDs and workspace-specific behavior

### Recommended Approach

1. **Port Generic features first** - Focus on utilities, games, and scrapers
2. **Build an adapter layer** - Abstract Slack concepts (buttons→components, blocks→embeds, threads→replies)
3. **Defer Slack-only features** - These require complete redesigns or external dashboards
4. **Timeline estimate** - 1-2 days for all Generic features with proper abstraction layer

---

## Generic Features (Discord-Portable)

### Commands - Easy Difficulty

These require minimal changes, mostly just swapping message posting APIs.

| File | Description | Port Effort |
|------|-------------|-------------|
| [ping.ts](./src/commands/ping.ts) | Simple slash command with message timing | ~15 min |
| [d20.ts](./src/commands/d20.ts) | Dice roller with file upload | ~30 min (map thread_ts to Discord reply) |
| [uuid.ts](./src/commands/uuid.ts) | UUID generator on message trigger | ~10 min |
| [capture-the-flag.ts](./src/commands/capture-the-flag.ts) | Simple CTF slash command/response | ~15 min |
| [on_mention.ts](./src/commands/on_mention.ts) | Reply when bot is mentioned | ~20 min (map to Discord mention event) |
| [codewatcher.ts](./src/commands/codewatcher.ts) | Session tracking and message posting | ~30 min |

**Key Changes Needed:**
- Replace `app.command()` with Discord slash command handlers
- Map `respond()` to Discord interaction replies
- Change file uploads from Slack API to Discord attachments
- Replace `thread_ts` with Discord message replies

---

### Commands - Medium Difficulty

These require UI rewrites (buttons/modals) and some API adaptation.

| File | Description | Challenges |
|------|-------------|------------|
| [poll.ts](./src/commands/poll.ts) | Poll creation with voting buttons | Rewrite Slack buttons→Discord buttons, action handlers→component collectors |
| [tag.ts](./src/commands/tag.ts) | Tag storage with modal UI | Map Slack modal/blocks→Discord modals/components, keep storage logic |
| [bdays.ts](./src/commands/bdays.ts) | Birthday storage via NocoDB | Replace ephemeral posts with Discord ephemeral or DM |
| [anondm.ts](./src/commands/anondm.ts) | Anonymous DM modal with user select | Rewrite modal and multi-user select UI, keep DM logic |
| [binstuff.ts](./src/commands/binstuff.ts) | Code block parsing and pastebin | Replace Slack rich_text parsing with Discord code fence regex |
| [zpurge.ts](./src/commands/zpurge.ts) | Bulk message deletion by user | Use Discord bulk delete API (14-day limit), scan channel history |
| [ratemyship.ts](./src/commands/ratemyship.ts) | GitHub API ship rating | Remove Slack channel gating, replace ephemeral messages |
| [zchannel.ts](./src/commands/zchannel.ts) | Custom username/icon posting | Discord can't impersonate—use webhooks or standard embeds instead |

**Key Changes Needed:**
- Slack Modals → Discord Modals (different JSON structure)
- Slack Buttons/Actions → Discord Components (buttons, select menus)
- Slack Block Kit → Discord Embeds
- Ephemeral messages → Discord ephemeral responses or DMs
- Thread replies → Discord message replies
- Username/icon override → Webhooks or embed author fields

---

### Modules - Easy Difficulty

Pure logic or simple utilities with no Slack coupling.

| File | Description | Notes |
|------|-------------|-------|
| [hangman.ts](./src/modules/hangman.ts) | Hangman game logic | Pure game state machine, no Slack dependencies |
| [status.ts](./src/modules/status.ts) | Jellyfin/Spotify status strings | Platform-agnostic status fetching |
| [sentry.ts](./src/modules/sentry.ts) | Sentry error monitoring init | Works with any platform |
| [encrypted-db.ts](./src/modules/encrypted-db.ts) | Crypto wrapper for JSONdb | Generic storage encryption |
| [robotics.ts](./src/modules/robotics.ts) | Text schedule parser and poster | Just swap message posting API |
| [alertcpu.ts](./src/modules/alertcpu.ts) | CPU usage monitor with alerts | Change alert posting to Discord |
| [memwatch.ts](./src/modules/memwatch.ts) | Memory leak detection | Platform-agnostic monitoring |
| [hw.ts](./src/modules/hw.ts) | iCal parsing utilities | Pure parsing logic |
| [capslockwhat.ts](./src/modules/capslockwhat.ts) | WebSocket consumer batch posts | Swap channel posting API |
| [stalkChrome.ts](./src/modules/stalkChrome.ts) | Placeholder module | No implementation yet |
| [smee.ts](./src/modules/smee.ts) | Webhook relay (commented out) | Platform-agnostic webhook handling |

**Port Strategy:** Keep all logic, just replace the final message posting calls with Discord equivalents.

---

### Modules - Medium Difficulty

These scrape external services and post to chat—need UI/posting adaptation.

| File | Description | Changes Needed |
|------|-------------|----------------|
| [bday.ts](./src/modules/bday.ts) | NocoDB birthday checker + poster | Map Slack posts→Discord embeds, keep DB logic |
| [15daysofcode.ts](./src/modules/15daysofcode.ts) | External site scraper/poster | Replace Slack posting with Discord embeds |
| [adventofcode.ts](./src/modules/adventofcode.ts) | Advent of Code leaderboard | Map Block Kit→Discord embeds |
| [ampcode.ts](./src/modules/ampcode.ts) | ampcode.com parsing/reporting | Convert Slack formatting to Discord |
| [flightly.ts](./src/modules/flightly.ts) | Flighty flight tracking scraper | Replace message posting API |
| [htn.ts](./src/modules/htn.ts) | Hack The North API integration | Convert to Discord embeds |
| [projectWaterydo.ts](./src/modules/projectWaterydo.ts) | Git webhook handler with threads | Map thread_ts→Discord replies |
| [school.ts](./src/modules/school.ts) | KCD portal scraper + notifications | Port notification logic to Discord |
| [seven39feed.ts](./src/modules/seven39feed.ts) | 7:39 scraper with scheduling | Re-map to Discord channel posting |
| [watch-git.ts](./src/modules/watch-git.ts) | Git repository polling/posting | Change posting to Discord webhooks/messages |
| [watchMyIrl.ts](./src/modules/watchMyIrl.ts) | IRL data service integration | Replace Slack posting with Discord |

**Port Strategy:** 
- Keep scraping/parsing logic intact
- Build Discord message/embed formatters
- Replace Slack scheduling with Discord-compatible cron
- Map threads to Discord replies or forum threads

---

## Slack-Only Features

### Hack Club Service Integrations

These are tightly coupled to hackclub.com services and Slack workspace.

#### Commands

| File | Hack Club Service | Why Slack-Only |
|------|-------------------|----------------|
| [hackclubcdn.ts](./src/commands/hackclubcdn.ts) | cdn.hackclub.com | HC CDN upload API + Slack ephemeral |
| [check-verification.ts](./src/commands/check-verification.ts) | identity.hackclub.com | HC identity verification service |
| [shipments-hackclub.ts](./src/commands/shipments-hackclub.ts) | HC shipments | Hack Club shipments system |
| [shipwrecled.ts](./src/commands/shipwrecled.ts) | HC shipwrecked CTF | Uses Slack channels.invite for CTF progression |
| [colbalt_api.ts](./src/commands/colbalt_api.ts) | cdn.hackclub.com | Hard-coded Slack channel + HC CDN uploader + Slack URL parsing |
| [vercel-cdn.ts](./src/commands/vercel-cdn.ts) | cdn.hackclub.com | Re-uploads Slack files to HC CDN |
| [joinchannel.ts](./src/commands/joinchannel.ts) | hackatime.hackclub.com | Slack conversations.invite + HC hackatime trust check |

#### Modules

| File | Hack Club Service | Purpose |
|------|-------------------|---------|
| [hackclubcdn.ts](./src/modules/hackclubcdn.ts) | cdn.hackclub.com | File upload API wrapper |
| [shipwrecked.ts](./src/modules/shipwrecked.ts) | shipwrecked.hackclub.com | Game integration + Slack posting |
| [theyswsdb.ts](./src/modules/theyswsdb.ts) | ships.hackclub.com | Ships database integration |
| [juice.ts](./src/modules/juice.ts) | juice.hackclub.com | Hack Club juice API |
| [TempHackclubEmail.ts](./src/modules/TempHackclubEmail.ts) | Slack mailbox channel | Uses Slack channel as email request flow |
| [journey.ts](./src/modules/journey.ts) | summer.hackclub.com | Summer integrations + Slack messaging |
| [noramail.ts](./src/modules/noramail.ts) | mail.hackclub.com | HC email integration |
| [parseShipments.ts](./src/modules/parseShipments.ts) | HC shipments API | Shipments viewer + Slack Block Kit |
| [lockinysws.ts](./src/modules/lockinysws.ts) | lockin.hackclub.com | Scraping + Slack posts |
| [hacktime.ts](./src/modules/hacktime.ts) | hackatime.hackclub.com | Usage tracking + Slack status posts |
| [rpgysws.ts](./src/modules/rpgysws.ts) | rpg.hackclub.com | RPG game + Slack posts |

**Verdict:** These would require Discord-specific HC integrations or alternative services. Not worth porting unless HC builds Discord equivalents.

---

### Slack API-Specific Features

These use Slack APIs with no Discord equivalent.

#### Channel Management & Admin

| File | Slack API Used | Discord Limitation |
|------|----------------|-------------------|
| [on_channel.ts](./src/commands/on_channel.ts) | `channel_created` event, `conversations.join` | Discord bots don't auto-join channels |
| [you_cant_join.ts](./src/commands/you_cant_join.ts) | `member_joined_channel`, `conversations.kick` | Different channel/member event model |
| [on_user_join.ts](./src/commands/on_user_join.ts) | `member_joined_channel`, kick/invite | Slack-specific channel membership flow |
| [submitflag.ts](./src/commands/submitflag.ts) | `conversations.invite` (CTF progression) | Would need Discord role-based channel access instead |
| [stickymessages.ts](./src/commands/stickymessages.ts) | Slack admin API (channel managers) | Requires Discord pins or custom DB tracking |
| [reset-ctf.ts](./src/commands/reset-ctf.ts) | Create/archive private channels, invite | Discord has channels but different permission model |
| [hoist_ur_channel.ts](./src/commands/hoist_ur_channel.ts) | `channel_rename`, create channels, admin manager discovery | Slack workspace admin features |

#### App Home & Views

| File | Feature | Discord Alternative |
|------|---------|-------------------|
| [home.ts](./src/commands/home.ts) | Slack App Home tab | None—use commands or web dashboard |

#### Slack Search & Analytics

| File | Slack API | Purpose |
|------|-----------|---------|
| [getSlackAnalytics.ts](./src/modules/getSlackAnalytics.ts) | Enterprise analytics endpoint (xoxc/xoxd cookies) | Workspace analytics |
| [slackLb.ts](./src/modules/slackLb.ts) | Analytics formatting | Leaderboard from Slack analytics |
| [howWasYourDay.ts](./src/modules/howWasYourDay.ts) | `search.messages`, user status | Slack message search + status API |
| [on_message.ts](./src/commands/on_message.ts) | `users.lookup`, `conversations.members`, `search.messages`, kick | Heavy admin bot commands |

#### Hard-Coded Slack Specifics

| File | Issue | Notes |
|------|-------|-------|
| [funny_msg.ts](./src/commands/funny_msg.ts) | Hard-coded Slack channel IDs + emoji | Workspace-specific config |
| [zeon_message.ts](./src/commands/zeon_message.ts) | ai.hackclub.com proxy + Slack reactions/threads | HC AI service + Slack threading |
| [howWasYourDayMessage.ts](./src/commands/howWasYourDayMessage.ts) | Slack channels, reactions, invites, AFK flow | Complex Slack workflow |
| [temp-whats-my-slack-id.ts](./src/commands/temp-whats-my-slack-id.ts) | Channel-specific + Slack ID formatting | Slack workspace utility |
| [hangman.ts](./src/commands/hangman.ts) | Tied to specific Slack channel | Command wrapper (game logic is portable) |
| [randomResponseSystem.ts](./src/modules/randomResponseSystem.ts) | Hard-coded Slack channels + emoji | Workspace config |

#### Framework Core

| File | Purpose | Notes |
|------|---------|-------|
| [BaseCommand.ts](./src/modules/BaseCommand.ts) | Command interface using @slack/bolt types | Would need Discord.js equivalent |
| [CommandLoader.ts](./src/modules/CommandLoader.ts) | Loads Slack commands with Bolt App | Discord.js command loading |
| [slackapp.ts](./src/modules/slackapp.ts) | Bolt App instance, routes, tokens | Core Slack bot setup |
| [cron.ts](./src/modules/cron.ts) | Sets Slack user status + wires HC/Slack pieces | Slack status API (Discord has no bot status like this) |
| [index.ts](./src/modules/index.ts) | `getChannelManagers` via Slack admin API | Slack admin cookies (xoxc/xoxd) |
| [uttered-oyster-ledge-lumber-velvet-using-coffee-injury-inline-ahead-dwelt-elope.ts](./src/commands/uttered-oyster-ledge-lumber-velvet-using-coffee-injury-inline-ahead-dwelt-elope.ts) | Unknown Slack-specific command | Likely Slack workspace joke/easter egg |

---

## Portability Difficulty Ratings

### Easy (1-2 hours total)
- Simple message/command behavior
- No buttons/modals/complex UI
- No admin APIs or HC integrations
- Minimal Slack-specific concepts

**Examples:** ping, uuid, hangman logic, status fetchers, monitoring utils

### Medium (3-8 hours total)
- Needs UI rewrites (buttons→components, blocks→embeds, modals)
- File attachments, replies vs threads
- Moderate API differences
- External service scrapers

**Examples:** polls, tags, anondm, zpurge, advent of code, git watchers

### Hard/Impossible
- Deeply Slack-specific (App Home, admin APIs, user status/search)
- Entirely Hack Club platform dependent
- No Discord equivalent exists

**Examples:** All HC integrations, Slack analytics, channel management, App Home

---

## Implementation Strategy

### Phase 1: Foundation (Day 1, Morning)
1. **Create Discord bot scaffolding**
   - Set up discord.js project
   - Create Discord equivalent of [BaseCommand.ts](./src/modules/BaseCommand.ts)
   - Build [CommandLoader.ts](./src/modules/CommandLoader.ts) for Discord

2. **Build adapter layer**
   ```typescript
   // Abstract message posting
   interface MessageAdapter {
     send(content: string | Embed): Promise<void>
     sendEphemeral(content: string): Promise<void>
     reply(content: string): Promise<void>
     uploadFile(buffer: Buffer, filename: string): Promise<void>
   }
   
   // Abstract UI components
   interface ComponentAdapter {
     createButton(label: string, id: string): Component
     createModal(title: string, fields: Field[]): Modal
     createEmbed(data: EmbedData): Embed
   }
   ```

3. **Port core utilities first**
   - [encrypted-db.ts](./src/modules/encrypted-db.ts) - Already platform-agnostic
   - [sentry.ts](./src/modules/sentry.ts) - Works as-is
   - [memwatch.ts](./src/modules/memwatch.ts), [alertcpu.ts](./src/modules/alertcpu.ts) - Just swap posting

### Phase 2: Easy Commands (Day 1, Afternoon)
Port in this order (parallel work possible):
1. [ping.ts](./src/commands/ping.ts) - Test slash commands
2. [uuid.ts](./src/commands/uuid.ts) - Test message events
3. [on_mention.ts](./src/commands/on_mention.ts) - Test mention handling
4. [codewatcher.ts](./src/commands/codewatcher.ts) - Test state tracking
5. [d20.ts](./src/commands/d20.ts) - Test file uploads + replies
6. [capture-the-flag.ts](./src/commands/capture-the-flag.ts) - Test simple logic

### Phase 3: Medium Commands (Day 2, Morning)
Focus on UI-heavy features:
1. [poll.ts](./src/commands/poll.ts) - Buttons/components
2. [tag.ts](./src/commands/tag.ts) - Modals
3. [anondm.ts](./src/commands/anondm.ts) - User selects
4. [bdays.ts](./src/commands/bdays.ts) - NocoDB integration
5. [binstuff.ts](./src/commands/binstuff.ts) - Code parsing
6. [zpurge.ts](./src/commands/zpurge.ts) - Bulk delete
7. [ratemyship.ts](./src/commands/ratemyship.ts) - GitHub API

### Phase 4: Scrapers & Integrations (Day 2, Afternoon)
Port external service integrations:
1. [adventofcode.ts](./src/modules/adventofcode.ts) - Test embed formatting
2. [ampcode.ts](./src/modules/ampcode.ts) - API integration
3. [watch-git.ts](./src/modules/watch-git.ts) - Git polling
4. [seven39feed.ts](./src/modules/seven39feed.ts) - Web scraping
5. [flightly.ts](./src/modules/flightly.ts), [htn.ts](./src/modules/htn.ts), [school.ts](./src/modules/school.ts) - More scrapers
6. [robotics.ts](./src/modules/robotics.ts), [bday.ts](./src/modules/bday.ts) - Scheduled posts

### Testing Strategy
After each phase:
- Test all slash commands
- Test all event handlers (message, mention, etc.)
- Test UI components (buttons, modals, embeds)
- Test file uploads and media
- Test permissions and ephemeral messages

---

## Key Technical Differences: Slack vs Discord

### Message Formatting
| Feature | Slack | Discord |
|---------|-------|---------|
| Rich UI | Block Kit (blocks, actions, sections) | Embeds + Components |
| Buttons | Block Kit buttons with `action_id` | Message Components with `customId` |
| Modals | Slack Modals (Block Kit) | Discord Modals (different structure) |
| Code blocks | Slack markdown + rich_text | Standard markdown with triple backticks |
| Mentions | `<@USER_ID>` | `<@USER_ID>` (same format!) |
| Channels | `<#CHANNEL_ID>` | `<#CHANNEL_ID>` (same format!) |

### Threading & Replies
| Feature | Slack | Discord |
|---------|-------|---------|
| Threads | `thread_ts` parameter | Reply to message or Forum threads |
| Thread creation | Any message can spawn thread | Manual thread creation or message reply |
| Thread visibility | Collapsed in channel | Replies inline or separate thread channel |

### Ephemeral Messages
| Feature | Slack | Discord |
|---------|-------|---------|
| Command responses | `response_type: "ephemeral"` | `interaction.reply({ ephemeral: true })` |
| Regular messages | `chat.postEphemeral()` | Not supported—use DMs instead |

### File Uploads
| Feature | Slack | Discord |
|---------|-------|---------|
| API | `files.upload` | `channel.send({ files: [attachment] })` |
| URL | Slack-hosted, requires auth | Discord CDN, public URLs |
| Size limits | 1GB (paid) / smaller (free) | 25MB (boosted) / 8MB (regular) |

### Permissions & Admin
| Feature | Slack | Discord |
|---------|-------|---------|
| Channel creation | `conversations.create` | `guild.channels.create` |
| User kick | `conversations.kick` | `member.kick()` |
| Channel managers | Slack admin API | Discord role-based permissions |
| App Home | Dedicated user-facing tab | None—use commands/web UI |
| Bot status | Can set bot user status | Can't set custom status |

### Events
| Feature | Slack | Discord |
|---------|-------|---------|
| Message events | `message` event | `messageCreate` event |
| Mentions | Part of message event | Check `message.mentions` |
| Channel join | `member_joined_channel` | `guildMemberAdd`, `channelCreate` |
| Reactions | `reaction_added` | `messageReactionAdd` |

---

## Migration Checklist

### Pre-Migration
- [ ] Set up Discord bot application in Discord Developer Portal
- [ ] Get bot token and configure OAuth2 scopes
- [ ] Create test Discord server
- [ ] Install discord.js and dependencies
- [ ] Port database connections (they should work as-is)

### Core Infrastructure
- [ ] Create Discord equivalent of [BaseCommand.ts](./src/modules/BaseCommand.ts)
- [ ] Port [CommandLoader.ts](./src/modules/CommandLoader.ts)
- [ ] Build message adapter layer
- [ ] Build component adapter layer (buttons, modals, embeds)
- [ ] Set up slash command registration
- [ ] Configure event handlers (messageCreate, interactionCreate, etc.)

### Easy Ports (6 commands)
- [ ] [ping.ts](./src/commands/ping.ts)
- [ ] [uuid.ts](./src/commands/uuid.ts)
- [ ] [on_mention.ts](./src/commands/on_mention.ts)
- [ ] [codewatcher.ts](./src/commands/codewatcher.ts)
- [ ] [d20.ts](./src/commands/d20.ts)
- [ ] [capture-the-flag.ts](./src/commands/capture-the-flag.ts)

### Medium Ports (8 commands)
- [ ] [poll.ts](./src/commands/poll.ts)
- [ ] [tag.ts](./src/commands/tag.ts)
- [ ] [anondm.ts](./src/commands/anondm.ts)
- [ ] [bdays.ts](./src/commands/bdays.ts)
- [ ] [binstuff.ts](./src/commands/binstuff.ts)
- [ ] [zpurge.ts](./src/commands/zpurge.ts)
- [ ] [ratemyship.ts](./src/commands/ratemyship.ts)
- [ ] [zchannel.ts](./src/commands/zchannel.ts)

### Easy Modules (11 modules)
- [ ] [hangman.ts](./src/modules/hangman.ts)
- [ ] [status.ts](./src/modules/status.ts)
- [ ] [sentry.ts](./src/modules/sentry.ts)
- [ ] [encrypted-db.ts](./src/modules/encrypted-db.ts)
- [ ] [robotics.ts](./src/modules/robotics.ts)
- [ ] [alertcpu.ts](./src/modules/alertcpu.ts)
- [ ] [memwatch.ts](./src/modules/memwatch.ts)
- [ ] [hw.ts](./src/modules/hw.ts)
- [ ] [capslockwhat.ts](./src/modules/capslockwhat.ts)
- [ ] [stalkChrome.ts](./src/modules/stalkChrome.ts)
- [ ] [smee.ts](./src/modules/smee.ts)

### Medium Modules (11 modules)
- [ ] [bday.ts](./src/modules/bday.ts)
- [ ] [15daysofcode.ts](./src/modules/15daysofcode.ts)
- [ ] [adventofcode.ts](./src/modules/adventofcode.ts)
- [ ] [ampcode.ts](./src/modules/ampcode.ts)
- [ ] [flightly.ts](./src/modules/flightly.ts)
- [ ] [htn.ts](./src/modules/htn.ts)
- [ ] [projectWaterydo.ts](./src/modules/projectWaterydo.ts)
- [ ] [school.ts](./src/modules/school.ts)
- [ ] [seven39feed.ts](./src/modules/seven39feed.ts)
- [ ] [watch-git.ts](./src/modules/watch-git.ts)
- [ ] [watchMyIrl.ts](./src/modules/watchMyIrl.ts)

### Testing & Deployment
- [ ] Test all ported commands in test server
- [ ] Test all ported modules
- [ ] Set up CI/CD for Discord bot
- [ ] Deploy to production Discord servers
- [ ] Monitor error rates via Sentry
- [ ] Document Discord-specific config

---

## Deferred Features (Slack-Only)

These will NOT be ported due to deep Slack/Hack Club coupling:

### All Hack Club Integrations (17 files)
- Commands: hackclubcdn, check-verification, shipments-hackclub, shipwrecled, colbalt_api, vercel-cdn, joinchannel
- Modules: hackclubcdn, shipwrecked, theyswsdb, juice, TempHackclubEmail, journey, noramail, parseShipments, lockinysws, hacktime, rpgysws

### Slack Admin Features (13 files)
- Commands: on_channel, you_cant_join, on_user_join, submitflag, stickymessages, reset-ctf, hoist_ur_channel, on_message
- Modules: getSlackAnalytics, slackLb, howWasYourDay, index (channel managers), cron (status)

### Slack-Specific UI (3 files)
- Commands: home (App Home)
- Modules: slackapp, BaseCommand/CommandLoader (framework core)

### Hard-Coded Slack Config (5 files)
- Commands: funny_msg, zeon_message, howWasYourDayMessage, temp-whats-my-slack-id, hangman (command wrapper), uttered-oyster-*
- Modules: randomResponseSystem

**Total Deferred:** 38 files (~60% of codebase)

---

## Estimated Effort Summary

| Category | Files | Time Estimate | Cumulative |
|----------|-------|---------------|------------|
| Infrastructure setup | 3 | 2-3 hours | 3h |
| Easy commands | 6 | 1-2 hours | 5h |
| Medium commands | 8 | 3-4 hours | 9h |
| Easy modules | 11 | 1-2 hours | 11h |
| Medium modules | 11 | 4-6 hours | 17h |
| Testing & fixes | - | 2-3 hours | 20h |
| **Total portable** | **36 files** | **~20 hours** | **2.5 days** |
| Slack-only (deferred) | 38 files | N/A | - |

**Conclusion:** With a solid adapter layer, ~40% of the codebase (36 files) can be ported to Discord in approximately 2.5 days of focused work.

---

## Additional Notes

### Security Considerations
- Discord tokens are different from Slack tokens—update .env structure
- Discord permissions model is role-based, not admin-API-based
- File upload limits differ—validate before upload
- Discord rate limits are stricter—implement backoff

### Database & Storage
- Most DB logic is platform-agnostic and can be reused as-is
- [encrypted-db.ts](./src/modules/encrypted-db.ts) works without changes
- NocoDB integrations ([bdays.ts](./src/commands/bdays.ts), [bday.ts](./src/modules/bday.ts)) are platform-agnostic

### External Service Integrations
These work on both platforms with minimal changes:
- GitHub API ([ratemyship.ts](./src/commands/ratemyship.ts))
- Advent of Code API ([adventofcode.ts](./src/modules/adventofcode.ts))
- Amp Code API ([ampcode.ts](./src/modules/ampcode.ts))
- Hack The North API ([htn.ts](./src/modules/htn.ts))
- Git webhooks ([projectWaterydo.ts](./src/modules/projectWaterydo.ts), [watch-git.ts](./src/modules/watch-git.ts))
- Web scrapers (7:39, Flighty, school portal, etc.)

### Recommended Architecture

```
discord-zeon/
├── src/
│   ├── adapters/
│   │   ├── MessageAdapter.ts       # Abstract message posting
│   │   ├── ComponentAdapter.ts     # Abstract UI components
│   │   └── EventAdapter.ts         # Abstract platform events
│   ├── commands/
│   │   └── [ported commands]/      # Discord implementations
│   ├── modules/
│   │   └── [ported modules]/       # Shared logic (mostly unchanged)
│   ├── core/
│   │   ├── DiscordCommand.ts       # Discord equivalent of BaseCommand
│   │   └── CommandLoader.ts        # Discord command registration
│   └── index.ts                    # Discord bot entry point
```

### Next Steps
1. Review this analysis with team
2. Decide which features to prioritize
3. Set up Discord bot infrastructure
4. Start with Phase 1 (foundation + easy commands)
5. Iterate based on user feedback

---

*This analysis was generated by AI (Oracle + Amp) on November 15, 2025. Review carefully before making architectural decisions.*
