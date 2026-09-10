// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                     CHESSIFY BACKEND — API REFERENCE                       ║
// ║                                                                            ║
// ║  Base URL: http://localhost:3000                                           ║
// ║  Auth: JWT via httpOnly cookies (accessToken + refreshToken)               ║
// ║  Token is auto-sent via cookies on every request after login               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝


// ┌──────────────────────────────────────────────────────────────────────────────┐
// │                           STANDALONE ROUTES                                 │
// └──────────────────────────────────────────────────────────────────────────────┘


// ──────────────────────────────────────────
// Health Check
// ──────────────────────────────────────────
// URL          : /
// METHOD       : GET
// Token        : No
//
// data body    : none
//
// data params  : none
//
// response body:
// "Hello World"
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Get Chess.com Player Data (Proxy)
// ──────────────────────────────────────────
// URL          : /chess.com/player/:username
// METHOD       : GET
// Token        : No
//
// data body    : none
//
// data params  : {
//     username : "hikaru"    // chess.com username
// }
//
// response body (200):
// {
//     // raw chess.com API player data
//     "player_id": 15448422,
//     "url": "https://www.chess.com/member/Hikaru",
//     "username": "Hikaru",
//     ...
// }
//
// error response (500):
// { "error": "Failed to fetch player data" }
// ──────────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────────────────────┐
// │                          USER ROUTES  (/api/user)                           │
// └──────────────────────────────────────────────────────────────────────────────┘


// ──────────────────────────────────────────
// Sign Up
// ──────────────────────────────────────────
// URL          : /api/user/signup
// METHOD       : POST
// Token        : No
// Content-Type : multipart/form-data (if uploading avatar) or application/json
//
// data body    : {
//     username : "john_doe",          // required, 6-30 chars, alphanumeric + underscore only
//     email    : "john@example.com",  // optional, valid email format
//     password : "secret123",         // required, 6-128 chars
//     about    : "Chess enthusiast",  // optional, max 500 chars
//     country  : "India"              // optional, one of: India, USA, UK, Germany, France, Russia, China, Japan, Other
// }
// file field   : avatar (optional, image file)
//
// data params  : none
//
// response body (201):
// {
//     "success": true,
//     "message": "User created successfully",
//     "data": null
// }
//
// error response (400):
// {
//     "success": false,
//     "message": "User exists with same username",
//     "data": null
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Login
// ──────────────────────────────────────────
// URL          : /api/user/login
// METHOD       : POST
// Token        : No
//
// data body    : {
//     username : "john_doe",     // required
//     password : "secret123"     // required
// }
//
// data params  : none
//
// Cookies Set  : accessToken (httpOnly, 1 day), refreshToken (httpOnly, 7 days)
//
// response body (200):
// {
//     "success": true,
//     "message": "User logged in successfully",
//     "data": {
//         "user": {
//             "id": "60d5f484f1a2c8b1f8e4e1a1",
//             "username": "john_doe",
//             "email": "john@example.com",
//             "about": "Chess enthusiast",
//             "avatar": "https://...",
//             "country": "India"
//         }
//     }
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Logout
// ──────────────────────────────────────────
// URL          : /api/user/logout
// METHOD       : GET
// Token        : No (clears cookies)
//
// data body    : none
//
// data params  : none
//
// response body (200):
// { "message": "User logged out successfully" }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Get User Profile
// ──────────────────────────────────────────
// URL          : /api/user/profile
// METHOD       : GET
// Token        : Yes — sent automatically via httpOnly cookies (accessToken)
//
// data body    : none
//
// data params  : none
//
// response body (200):
// {
//     "success": true,
//     "message": "User profile retrieved successfully",
//     "data": {
//         "_id": "60d5f484f1a2c8b1f8e4e1a1",
//         "username": "john_doe",
//         "email": "john@example.com",
//         "about": "Chess enthusiast",
//         "avatar": "https://...",
//         "rating": 500,
//         "titles": [],
//         "isAdmin": false,
//         "onGoingGames": [],
//         "isBanned": false,
//         "country": "India",
//         "followings": [],
//         "followers": [],
//         "friends": [],
//         "status": "None",
//         "gamesPlayed": 0,
//         "wins": 0,
//         "losses": 0,
//         "draws": 0,
//         "gameHistory": []
//     }
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Edit Full Profile (all fields at once)
// ──────────────────────────────────────────
// URL          : /api/user/profile/edit
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Content-Type : multipart/form-data (if uploading avatar) or application/json
//
// data body    : {
//     username : "new_username",      // optional, 6-30 chars
//     email    : "new@email.com",     // optional
//     about    : "Updated bio",       // optional, max 500 chars
//     country  : "USA"                // optional
// }
// file field   : avatar (optional, image file)
//
// data params  : none
//
// response body (200):
// {
//     "success": true,
//     "message": "User profile edited successfully",
//     "data": {
//         "username": "new_username",
//         "email": "new@email.com",
//         "about": "Updated bio",
//         "avatar": "https://...",
//         "country": "USA"
//     }
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Edit Username
// ──────────────────────────────────────────
// URL          : /api/user/profile/edit/username
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     username : "new_username"    // required, 6-30 chars, alphanumeric + underscore
// }
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "Username changed successfully", "data": null }
//
// error response (400):
// { "success": false, "message": "Username already exists", "data": null }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Edit Email
// ──────────────────────────────────────────
// URL          : /api/user/profile/edit/email
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     email : "newemail@example.com"    // required, valid email format
// }
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "Email changed successfully", "data": { "email": "newemail@example.com" } }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Edit Password
// ──────────────────────────────────────────
// URL          : /api/user/profile/edit/password
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     oldPassword : "current_password",    // required
//     password    : "new_password123"      // required
// }
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "Password changed successfully", "data": null }
//
// error response (400):
// { "success": false, "message": "Incorrect password", "data": null }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Edit About
// ──────────────────────────────────────────
// URL          : /api/user/profile/edit/about
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     about : "New bio text"    // required, max 500 chars
// }
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "About changed successfully", "data": { "about": "New bio text" } }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Edit Country
// ──────────────────────────────────────────
// URL          : /api/user/profile/edit/country
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     country : "Germany"    // required, one of: India, USA, UK, Germany, France, Russia, China, Japan
// }
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "Country changed successfully", "data": { "country": "Germany" } }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Edit Status
// ──────────────────────────────────────────
// URL          : /api/user/profile/edit/status
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     status : "Gold"    // required, one of: None, Gold, Platinum, Diamond
// }
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "Status changed successfully", "data": { "status": "Gold" } }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Edit Avatar
// ──────────────────────────────────────────
// URL          : /api/user/profile/edit/avatar
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Content-Type : multipart/form-data
//
// data body    : none (file upload only)
// file field   : avatar (required, image file)
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "Avatar changed successfully", "data": { "avatar": "https://res.cloudinary.com/..." } }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Remove Avatar
// ──────────────────────────────────────────
// URL          : /api/user/profile/avatar/remove
// METHOD       : GET
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "Avatar removed successfully", "data": null }
//
// Note: Also accessible via /api/user/profile/avatar/delete (same handler)
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Follow User
// ──────────────────────────────────────────
// URL          : /api/user/follow
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     userId : "60d5f484f1a2c8b1f8e4e1a2"    // required, ObjectId of user to follow
// }
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "User followed successfully", "data": null }
//
// Notes:
// - Uses MongoDB transaction for atomicity
// - If both users follow each other, they become "friends" automatically
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Unfollow User
// ──────────────────────────────────────────
// URL          : /api/user/unfollow
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     userId : "60d5f484f1a2c8b1f8e4e1a2"    // required, ObjectId of user to unfollow
// }
//
// data params  : none
//
// response body (200):
// { "success": true, "message": "User unfollowed successfully", "data": null }
//
// Notes:
// - Uses MongoDB transaction for atomicity
// - If they were friends, friendship is removed on both sides
// ──────────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────────────────────┐
// │                         GAME ROUTES  (/api/game)                            │
// │                                                                             │
// │  All routes require authentication (JWT via cookies)                        │
// │  Correspondence chess — moves can take hours/days                           │
// └──────────────────────────────────────────────────────────────────────────────┘


// ──────────────────────────────────────────
// Create Game
// ──────────────────────────────────────────
// URL          : /api/game/create
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     gameType            : "invite",    // required, "invite" or "matchmaking"
//     maxTimePerMoveHours : 24           // optional, default 24, range 1-336 (14 days)
// }
//
// data params  : none
//
// response body — invite (201):
// {
//     "success": true,
//     "message": "Game created. Share the invite code with your friend.",
//     "data": {
//         "gameId": "60d5f484f1a2c8b1f8e4e1a3",
//         "inviteCode": "A1B2C3D4",
//         "maxTimePerMoveHours": 24
//     }
// }
//
// response body — matchmaking (201):
// {
//     "success": true,
//     "message": "Challenge sent to a random opponent. Waiting for their response.",
//     "data": {
//         "_id": "60d5f484f1a2c8b1f8e4e1a4",
//         "challenger": { "username": "john_doe", "avatar": "...", "rating": 500 },
//         "challenged": { "username": "jane_doe", "avatar": "...", "rating": 520 },
//         "status": "pending",
//         "maxTimePerMoveHours": 24,
//         "expiresAt": "2026-09-12T01:20:00.000Z"
//     }
// }
//
// Notes:
// - "invite" creates a waiting game with an 8-char invite code
// - "matchmaking" finds a random opponent within ±150 Elo and sends a challenge
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Join Game by Invite Code
// ──────────────────────────────────────────
// URL          : /api/game/join/:inviteCode
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : {
//     inviteCode : "A1B2C3D4"    // 8-char alphanumeric invite code
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Joined game successfully. Game is now active!",
//     "data": {
//         // full game object with both players, FEN, status "active", etc.
//     }
// }
//
// Notes:
// - Colors (white/black) assigned randomly with 50/50 probability
// - Invite code is consumed (deleted) after use
// - Cannot join your own game
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Get My Active Games
// ──────────────────────────────────────────
// URL          : /api/game/my/active
// METHOD       : GET
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : none
//
// response body (200):
// {
//     "success": true,
//     "message": "Active games retrieved",
//     "data": [
//         {
//             "gameId": "...",
//             "status": "active",
//             "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
//             "currentTurn": "b",
//             "myColor": "white",
//             "remainingTimeMs": 86400000,
//             "white": { "username": "...", "avatar": "...", "rating": 500 },
//             "black": { "username": "...", "avatar": "...", "rating": 520 },
//             ...
//         }
//     ]
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Get My Game History
// ──────────────────────────────────────────
// URL          : /api/game/my/history
// METHOD       : GET
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : none
//
// query params : {
//     page  : 1,     // optional, default 1
//     limit : 20     // optional, default 20
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Game history retrieved",
//     "data": {
//         "games": [ ... ],
//         "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
//     }
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Get Game State
// ──────────────────────────────────────────
// URL          : /api/game/:gameId
// METHOD       : GET
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : {
//     gameId : "60d5f484f1a2c8b1f8e4e1a3"    // MongoDB ObjectId of the game
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Game state retrieved",
//     "data": {
//         "gameId": "...",
//         "status": "active",
//         "gameType": "invite",
//         "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
//         "pgn": "1. e4",
//         "moves": ["e2e4"],
//         "currentTurn": "b",
//         "result": "ongoing",
//         "resultReason": null,
//         "maxTimePerMoveHours": 24,
//         "remainingTimeMs": 85000000,
//         "drawOfferedBy": null,
//         "ratingChange": { "white": 0, "black": 0 },
//         "myColor": "white",
//         "white": { "username": "...", "avatar": "...", "rating": 500 },
//         "black": { "username": "...", "avatar": "...", "rating": 520 }
//     }
// }
//
// Notes:
// - Lazy timeout check: if the opponent's time has expired, this call will
//   automatically end the game with a timeout result
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Make a Move
// ──────────────────────────────────────────
// URL          : /api/game/:gameId/move
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     from      : "e2",    // required, source square (a1-h8)
//     to        : "e4",    // required, target square (a1-h8)
//     promotion : "q"      // optional, only for pawn promotion: q, r, b, or n
// }
//
// data params  : {
//     gameId : "60d5f484f1a2c8b1f8e4e1a3"
// }
//
// response body — move made (200):
// {
//     "success": true,
//     "message": "Move made successfully",
//     "data": {
//         "game": { ... },   // updated game state
//         "moveResult": {
//             "from": "e2",
//             "to": "e4",
//             "piece": "p",
//             "captured": null,
//             "promotion": null,
//             "san": "e4",
//             "isCheck": false
//         },
//         "gameOver": false
//     }
// }
//
// response body — checkmate (200):
// {
//     "success": true,
//     "message": "Game over — checkmate",
//     "data": {
//         "gameOver": true,
//         "result": "white",
//         "reason": "checkmate",
//         "ratingChange": { "white": 15, "black": -15 },
//         "newRatings": { "white": 515, "black": 485 }
//     }
// }
//
// error response (400):
// { "success": false, "error": "Illegal move" }
// { "success": false, "error": "It is not your turn" }
//
// Notes:
// - Move validated by chess.js engine
// - Checks timeout before processing
// - Checks for checkmate/stalemate/draw after every move
// - Resets the opponent's move timer after a successful move
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Resign
// ──────────────────────────────────────────
// URL          : /api/game/:gameId/resign
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : {
//     gameId : "60d5f484f1a2c8b1f8e4e1a3"
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "You resigned. Game over.",
//     "data": {
//         "gameOver": true,
//         "result": "black",
//         "reason": "resignation",
//         "ratingChange": { "white": -15, "black": 15 },
//         "newRatings": { "white": 485, "black": 515 }
//     }
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Offer Draw
// ──────────────────────────────────────────
// URL          : /api/game/:gameId/draw/offer
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : {
//     gameId : "60d5f484f1a2c8b1f8e4e1a3"
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Draw offer sent",
//     "data": { "message": "Draw offer sent", "gameId": "..." }
// }
//
// Notes:
// - Only one pending draw offer at a time
// - Draw offer is cleared if a move is made
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Respond to Draw Offer
// ──────────────────────────────────────────
// URL          : /api/game/:gameId/draw/respond
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     accept : true    // required, true to accept draw, false to decline
// }
//
// data params  : {
//     gameId : "60d5f484f1a2c8b1f8e4e1a3"
// }
//
// response body — accepted (200):
// {
//     "success": true,
//     "message": "Game over — draw agreed",
//     "data": {
//         "gameOver": true,
//         "result": "draw",
//         "reason": "draw_agreement",
//         "ratingChange": { "white": 0, "black": 0 },
//         "newRatings": { "white": 500, "black": 500 }
//     }
// }
//
// response body — declined (200):
// { "success": true, "message": "Draw offer declined", "data": { ... } }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Get In-Game Chat Messages
// ──────────────────────────────────────────
// URL          : /api/game/:gameId/chat
// METHOD       : GET
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : {
//     gameId : "60d5f484f1a2c8b1f8e4e1a3"
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Chat messages retrieved",
//     "data": [
//         {
//             "sender": "60d5f484f1a2c8b1f8e4e1a1",
//             "message": "Good game!",
//             "timestamp": "2026-09-11T01:30:00.000Z"
//         }
//     ]
// }
//
// Notes: Game chats are temporary — cleared when the game ends
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Send In-Game Chat Message
// ──────────────────────────────────────────
// URL          : /api/game/:gameId/chat
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     message : "Good luck!"    // required, 1-200 chars
// }
//
// data params  : {
//     gameId : "60d5f484f1a2c8b1f8e4e1a3"
// }
//
// response body (201):
// {
//     "success": true,
//     "message": "Message sent",
//     "data": {
//         "sender": "60d5f484f1a2c8b1f8e4e1a1",
//         "message": "Good luck!",
//         "timestamp": "2026-09-11T01:35:00.000Z"
//     }
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// List Pending Challenges
// ──────────────────────────────────────────
// URL          : /api/game/challenges
// METHOD       : GET
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : none
//
// response body (200):
// {
//     "success": true,
//     "message": "Challenges retrieved",
//     "data": {
//         "received": [
//             {
//                 "_id": "...",
//                 "challenger": { "username": "...", "avatar": "...", "rating": 520 },
//                 "status": "pending",
//                 "maxTimePerMoveHours": 24,
//                 "expiresAt": "..."
//             }
//         ],
//         "sent": [
//             {
//                 "_id": "...",
//                 "challenged": { "username": "...", "avatar": "...", "rating": 480 },
//                 "status": "pending",
//                 "maxTimePerMoveHours": 120,
//                 "expiresAt": "..."
//             }
//         ]
//     }
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Respond to Challenge
// ──────────────────────────────────────────
// URL          : /api/game/challenge/:challengeId/respond
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : {
//     accept : true    // required, true to accept, false to decline
// }
//
// data params  : {
//     challengeId : "60d5f484f1a2c8b1f8e4e1a4"
// }
//
// response body — accepted (200):
// {
//     "success": true,
//     "message": "Challenge accepted — game started!",
//     "data": {
//         "message": "Challenge accepted — game started!",
//         "game": { ... }   // full game object with both players, active status
//     }
// }
//
// response body — declined (200):
// { "success": true, "message": "Challenge declined", "data": null }
//
// Notes:
// - Only the challenged player can respond
// - On accept: game is created, colors assigned randomly, both players' onGoingGames updated
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Cancel Challenge
// ──────────────────────────────────────────
// URL          : /api/game/challenge/:challengeId/cancel
// METHOD       : POST
// Token        : Yes — httpOnly cookies
//
// data body    : none
//
// data params  : {
//     challengeId : "60d5f484f1a2c8b1f8e4e1a4"
// }
//
// response body (200):
// { "success": true, "message": "Challenge cancelled", "data": null }
//
// Notes: Only the challenger can cancel their own challenge
// ──────────────────────────────────────────


// ┌──────────────────────────────────────────────────────────────────────────────┐
// │                         CHAT ROUTES  (/api/chat)                            │
// │                                                                             │
// │  All routes require authentication (JWT via cookies)                        │
// │  Role hierarchy: creator (superAdmin) > admin > member                      │
// └──────────────────────────────────────────────────────────────────────────────┘


// ──────────────────────────────────────────
// Create Direct (1-on-1) Conversation
// ──────────────────────────────────────────
// URL          : /api/chat/direct
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : any authenticated user
//
// data body    : {
//     userId : "60d5f484f1a2c8b1f8e4e1a2"    // required, ObjectId of the other user
// }
//
// data params  : none
//
// response body (201 — new):
// {
//     "success": true,
//     "message": "Direct conversation created",
//     "data": {
//         "_id": "...",
//         "members": [
//             { "user": { "username": "john_doe", ... }, "role": "member" },
//             { "user": { "username": "jane_doe", ... }, "role": "member" }
//         ],
//         "isGroup": false
//     }
// }
//
// response body (200 — already exists):
// {
//     "success": true,
//     "message": "Conversation already exists",
//     "data": { ... }
// }
//
// Notes: If a 1-on-1 conversation already exists, returns the existing one
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Create Group Conversation
// ──────────────────────────────────────────
// URL          : /api/chat/group
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : any authenticated user
//
// data body    : {
//     groupName : "Chess Club",                                      // required, 3-50 chars
//     members   : ["60d5f484f1a2c8b1f8e4e1a2", "..."]               // optional, array of user ObjectIds
// }
//
// data params  : none
//
// response body (201):
// {
//     "success": true,
//     "message": "Group created successfully",
//     "data": {
//         "_id": "...",
//         "members": [
//             { "user": { "username": "john_doe", ... }, "role": "creator" },
//             { "user": { "username": "jane_doe", ... }, "role": "member" }
//         ],
//         "isGroup": true,
//         "groupName": "Chess Club"
//     }
// }
//
// Notes: The creator automatically gets "creator" role (superAdmin)
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// List My Conversations
// ──────────────────────────────────────────
// URL          : /api/chat/my
// METHOD       : GET
// Token        : Yes — httpOnly cookies
// Role         : any authenticated user
//
// data body    : none
//
// data params  : none
//
// response body (200):
// {
//     "success": true,
//     "message": "Conversations retrieved",
//     "data": [
//         {
//             "_id": "...",
//             "members": [ ... ],
//             "isGroup": true,
//             "groupName": "Chess Club",
//             "lastMessage": { ... },
//             "updatedAt": "..."
//         },
//         {
//             "_id": "...",
//             "members": [ ... ],
//             "isGroup": false,
//             "lastMessage": { ... }
//         }
//     ]
// }
//
// Notes: Sorted by most recently updated first
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Join Group by Invite Code
// ──────────────────────────────────────────
// URL          : /api/chat/join/:inviteCode
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : any authenticated user (no membership required)
//
// data body    : none
//
// data params  : {
//     inviteCode : "A1B2C3D4"    // 8-char invite code generated by an admin
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Joined group successfully",
//     "data": { ... }    // populated conversation object
// }
//
// error responses:
// { "success": false, "error": "Invalid invite code" }
// { "success": false, "error": "This invite code has expired" }
// { "success": false, "error": "You are already a member of this group" }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Get Conversation Details
// ──────────────────────────────────────────
// URL          : /api/chat/:conversationId
// METHOD       : GET
// Token        : Yes — httpOnly cookies
// Role         : member, admin, or creator
//
// data body    : none
//
// data params  : {
//     conversationId : "60d5f484f1a2c8b1f8e4e1a5"
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Conversation details retrieved",
//     "data": {
//         "_id": "...",
//         "members": [
//             { "user": { "username": "...", "avatar": "...", "rating": 500 }, "role": "creator" },
//             { "user": { "username": "...", "avatar": "...", "rating": 480 }, "role": "admin" },
//             { "user": { "username": "...", "avatar": "...", "rating": 520 }, "role": "member" }
//         ],
//         "isGroup": true,
//         "groupName": "Chess Club",
//         "lastMessage": { ... },
//         "inviteCode": "A1B2C3D4",
//         "inviteCodeExpiresAt": "2026-09-12T01:20:00.000Z"
//     }
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Delete Group
// ──────────────────────────────────────────
// URL          : /api/chat/:conversationId
// METHOD       : DELETE
// Token        : Yes — httpOnly cookies
// Role         : creator only
//
// data body    : none
//
// data params  : {
//     conversationId : "60d5f484f1a2c8b1f8e4e1a5"
// }
//
// response body (200):
// { "success": true, "message": "Group deleted successfully", "data": null }
//
// error response (403):
// { "success": false, "error": "Only the group creator can perform this action" }
//
// Notes: Only group conversations can be deleted. Direct conversations cannot.
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Leave Conversation
// ──────────────────────────────────────────
// URL          : /api/chat/:conversationId/leave
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : member, admin, or creator (but creator cannot leave — must delete instead)
//
// data body    : none
//
// data params  : {
//     conversationId : "60d5f484f1a2c8b1f8e4e1a5"
// }
//
// response body (200):
// { "success": true, "message": "You have left the conversation", "data": null }
//
// error response:
// { "success": false, "error": "The group creator cannot leave. Delete the group instead." }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Add Member to Group
// ──────────────────────────────────────────
// URL          : /api/chat/:conversationId/members/add
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : admin or creator
//
// data body    : {
//     userId : "60d5f484f1a2c8b1f8e4e1a2"    // required, ObjectId of user to add
// }
//
// data params  : {
//     conversationId : "60d5f484f1a2c8b1f8e4e1a5"
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Member added successfully",
//     "data": { ... }    // updated conversation with new member list
// }
//
// Notes: New member gets "member" role by default. Only works for groups.
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Remove Member from Group
// ──────────────────────────────────────────
// URL          : /api/chat/:conversationId/members/remove
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : admin or creator (but only creator can remove admins)
//
// data body    : {
//     userId : "60d5f484f1a2c8b1f8e4e1a2"    // required, ObjectId of user to remove
// }
//
// data params  : {
//     conversationId : "60d5f484f1a2c8b1f8e4e1a5"
// }
//
// response body (200):
// { "success": true, "message": "Member removed successfully", "data": null }
//
// error responses:
// { "success": false, "error": "The group creator cannot be removed" }
// { "success": false, "error": "Only the group creator can remove admins" }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Change Member Role
// ──────────────────────────────────────────
// URL          : /api/chat/:conversationId/members/role
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : admin or creator (but only creator can demote admins)
//
// data body    : {
//     userId : "60d5f484f1a2c8b1f8e4e1a2",    // required, ObjectId of user
//     role   : "admin"                          // required, "admin" or "member"
// }
//
// data params  : {
//     conversationId : "60d5f484f1a2c8b1f8e4e1a5"
// }
//
// response body (200):
// { "success": true, "message": "Role changed to admin successfully", "data": null }
//
// error responses:
// { "success": false, "error": "The creator's role cannot be changed" }
// { "success": false, "error": "Only the group creator can demote admins" }
// { "success": false, "error": "Cannot assign creator role" }
//
// Notes:
// - Admins can promote members to admin
// - Only creator can demote admins back to member
// - Creator role can never be assigned or changed
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Generate Invite Code
// ──────────────────────────────────────────
// URL          : /api/chat/:conversationId/invite
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : admin or creator
//
// data body    : none
//
// data params  : {
//     conversationId : "60d5f484f1a2c8b1f8e4e1a5"
// }
//
// response body (201):
// {
//     "success": true,
//     "message": "Invite code generated",
//     "data": {
//         "inviteCode": "X9Y8Z7W6",
//         "expiresAt": "2026-09-12T01:50:00.000Z"
//     }
// }
//
// Notes:
// - Invite codes expire after 24 hours
// - Generating a new code replaces the previous one
// - Only works for group conversations
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Send Message
// ──────────────────────────────────────────
// URL          : /api/chat/:conversationId/messages
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : member, admin, or creator
//
// data body    : {
//     content : "Hello everyone!"    // required, 1-2000 chars
// }
//
// data params  : {
//     conversationId : "60d5f484f1a2c8b1f8e4e1a5"
// }
//
// response body (201):
// {
//     "success": true,
//     "message": "Message sent",
//     "data": {
//         "_id": "...",
//         "sender": { "username": "john_doe", "avatar": "..." },
//         "content": "Hello everyone!",
//         "conversation": "...",
//         "isDeleted": false,
//         "createdAt": "2026-09-11T01:55:00.000Z"
//     }
// }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Get Messages (Paginated)
// ──────────────────────────────────────────
// URL          : /api/chat/:conversationId/messages
// METHOD       : GET
// Token        : Yes — httpOnly cookies
// Role         : member, admin, or creator
//
// data body    : none
//
// data params  : {
//     conversationId : "60d5f484f1a2c8b1f8e4e1a5"
// }
//
// query params : {
//     page  : 1,     // optional, default 1
//     limit : 50     // optional, default 50
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Messages retrieved",
//     "data": {
//         "messages": [
//             {
//                 "_id": "...",
//                 "sender": { "username": "john_doe", "avatar": "..." },
//                 "content": "Hello!",
//                 "createdAt": "2026-09-11T01:50:00.000Z"
//             },
//             {
//                 "_id": "...",
//                 "sender": { "username": "jane_doe", "avatar": "..." },
//                 "content": "Hi there!",
//                 "createdAt": "2026-09-11T01:51:00.000Z"
//             }
//         ],
//         "pagination": { "page": 1, "limit": 50, "total": 2, "totalPages": 1 }
//     }
// }
//
// Notes: Soft-deleted messages are excluded from results
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Delete Message (Soft Delete)
// ──────────────────────────────────────────
// URL          : /api/chat/messages/:messageId
// METHOD       : DELETE
// Token        : Yes — httpOnly cookies
// Role         : message sender only
//
// data body    : none
//
// data params  : {
//     messageId : "60d5f484f1a2c8b1f8e4e1a6"
// }
//
// response body (200):
// { "success": true, "message": "Message deleted successfully", "data": null }
//
// error response:
// { "success": false, "error": "You can only delete your own messages" }
//
// Notes: Messages are soft-deleted (isDeleted = true), not permanently removed
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Report a Message
// ──────────────────────────────────────────
// URL          : /api/chat/messages/:messageId/report
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : any conversation member
//
// data body    : {
//     reportReason : "abuse",                     // required, one of: spam, abuse, hate, violence, sexual, other
//     description  : "User was being offensive"   // optional, max 500 chars
// }
//
// data params  : {
//     messageId : "60d5f484f1a2c8b1f8e4e1a6"
// }
//
// response body (201):
// {
//     "success": true,
//     "message": "Message reported successfully",
//     "data": {
//         "_id": "...",
//         "reporter": "...",
//         "messageId": "...",
//         "conversation": "...",
//         "reportReason": "abuse",
//         "description": "User was being offensive",
//         "status": "pending"
//     }
// }
//
// error responses:
// { "success": false, "error": "You cannot report your own message" }
// { "success": false, "error": "You have already reported this message" }
// { "success": false, "error": "This message has already been deleted" }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// List Pending Reports (Platform Admin)
// ──────────────────────────────────────────
// URL          : /api/chat/admin/reports
// METHOD       : GET
// Token        : Yes — httpOnly cookies
// Role         : platform admin only (isAdmin: true on User model)
//
// data body    : none
//
// data params  : none
//
// query params : {
//     page  : 1,     // optional, default 1
//     limit : 20     // optional, default 20
// }
//
// response body (200):
// {
//     "success": true,
//     "message": "Pending reports retrieved",
//     "data": {
//         "reports": [
//             {
//                 "_id": "...",
//                 "reporter": { "username": "jane_doe", "avatar": "..." },
//                 "messageId": {
//                     "sender": { "username": "bad_user", "avatar": "..." },
//                     "content": "inappropriate message here",
//                     "createdAt": "..."
//                 },
//                 "conversation": { "groupName": "Chess Club", "isGroup": true },
//                 "reportReason": "abuse",
//                 "description": "Very offensive language",
//                 "status": "pending",
//                 "createdAt": "..."
//             }
//         ],
//         "pagination": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 }
//     }
// }
//
// error response (403):
// { "success": false, "error": "Only platform administrators can perform this action" }
// ──────────────────────────────────────────


// ──────────────────────────────────────────
// Resolve / Reject Report (Platform Admin)
// ──────────────────────────────────────────
// URL          : /api/chat/admin/reports/:reportId/resolve
// METHOD       : POST
// Token        : Yes — httpOnly cookies
// Role         : platform admin only (isAdmin: true on User model)
//
// data body    : {
//     action : "resolve"    // required, "resolve" or "reject"
// }
//
// data params  : {
//     reportId : "60d5f484f1a2c8b1f8e4e1a7"
// }
//
// response body — resolve (200):
// {
//     "success": true,
//     "message": "Report resolved — message deleted and sender banned",
//     "data": {
//         "message": "Report resolved — message deleted and sender banned",
//         "bannedUser": "bad_user"
//     }
// }
//
// response body — reject (200):
// {
//     "success": true,
//     "message": "Report rejected — no action taken",
//     "data": { "message": "Report rejected — no action taken" }
// }
//
// Notes:
// - "resolve" = message was inappropriate → soft-delete message + permanently ban sender
// - "reject"  = message was fine → mark report as rejected, no action taken
// - The resolving admin's ID is stored on the report for audit trail
// ──────────────────────────────────────────


// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║                           STANDARD RESPONSE FORMAT                         ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║                                                                            ║
// ║  All responses follow this structure:                                      ║
// ║                                                                            ║
// ║  {                                                                         ║
// ║      "success" : true | false,        // true if status 2xx               ║
// ║      "message" : "Description",       // human-readable message           ║
// ║      "data"    : { ... } | null       // response payload or null         ║
// ║  }                                                                         ║
// ║                                                                            ║
// ║  Authentication:                                                           ║
// ║  - Tokens are stored as httpOnly cookies (accessToken + refreshToken)      ║
// ║  - Set automatically on login, sent automatically on every request        ║
// ║  - accessToken expires in 1 hour (auto-refreshed via refreshToken)        ║
// ║  - refreshToken expires in 7 days                                         ║
// ║  - No manual Authorization header needed                                  ║
// ║                                                                            ║
// ║  Error Handling:                                                           ║
// ║  - 400 = Bad request / validation error                                   ║
// ║  - 401 = Unauthorized (missing or invalid token)                          ║
// ║  - 403 = Forbidden (insufficient role/permissions)                        ║
// ║  - 404 = Resource not found                                               ║
// ║  - 500 = Internal server error                                            ║
// ║                                                                            ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
