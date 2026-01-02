# Astrum - Multi-Platform Client for [Neper](https://github.com/neper-stars/neper) API

**Astrum** (from Greek ἄστρον - "star") is a modern, desktop client
for managing Stars! game sessions via the [Neper](https://github.com/neper-stars/neper) API.

Built with Go and Wails, it provides a clean,
intuitive interface for server management,
user authentication, and game session coordination.

## Dependencies

This project makes use of the [Houston](https://github.com/neper-stars/houston) library.
And it is a client for the [Neper](https://github.com/neper-stars/neper) server.

## Screenshots

### Welcome Screen
Connect to multiple Neper servers from the sidebar. Each server shows its connection status with a colored indicator.

![Welcome Screen](doc/01-welcome.png)

### Sessions List
Browse all game sessions on a server. Filter by your sessions, public games, invitations, or games waiting for your turn. See at a glance the current year, player count, and turn submission status.

![Sessions List](doc/02-sessions.png)

### Session Details
View complete session information including players, members, managers, and turn history. Manage invitations, promote members, and access game actions.

![Session Details](doc/03-session-details.png)

### Launch Stars!
Launch the Stars! client directly from Astrum. On Linux, Wine integration is built-in with per-server prefixes. Turn files are automatically downloaded and managed.

![Launch Stars!](doc/04-launch-stars.png)

### Map Viewer
Generate SVG maps from your turn files. Configure display options like fleet paths, scanner coverage, minefields, and wormholes. Export maps as SVG files.

![Map Viewer](doc/05-generate-map.png)
