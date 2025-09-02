// src/app/services/slackService.js
//  - Environment variables are loaded from `.env.local` (SLACK_BOT_TOKEN, CHANNEL_NAME, USER_EMAIL optional).
//  - Required Slack app scopes: `chat:write`, `files:write`, `conversations:read`, `conversations:write`, `conversations:members`, `users:read.email`.


import { config } from 'dotenv';
import path from 'path';
import { readFileSync } from 'fs';
import { WebClient } from '@slack/web-api';

// Load .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const token = process.env.SLACK_BOT_TOKEN;
if (!token) throw new Error('SLACK_BOT_TOKEN is not defined');

export const slackClient = new WebClient(token);

function markdownToMrkdwn(markdown) {
    return markdown
        .replace(/^## (.*)$/gm, '*$1*')
        .replace(/\*\*(.*?)\*\*/g, '*$1*') // **bold** → *bold*
        .replace(/^\* (.*)/gm, '• $1')     // * item → • item
        .replace(/\n{2,}/g, '\n\n');       // normalizar quebras
}

export async function postToSlack(channel, ataName, markdownText) {

    function chunkString(str, length) {
        return str.match(new RegExp('.{1,' + length + '}', 'g'));
    }

    const slackText = markdownToMrkdwn(markdownText);
    const chunks = chunkString(slackText, 3000);


    return await slackClient.chat.postMessage({
        channel,
        text: ataName, // fallback (texto simples)
        blocks: chunks.map(c => ({
            type: "section",
            text: { type: "mrkdwn", text: c }
        })),
    });
}

/**
 *  Send a TEXT message to a DM..
 * - `id` can be a channel id (C...) or a DM id (D...).
 * - Uses `chat.postMessage`.
 *
 * @param {string} id  channel id or dm id.
 * @param {string} text  Message text.
 * @param {string} username  Display username (optional — depends on app permissions).
 * @param {string} icon_emoji  Optional emoji for the message avatar.
 * @returns {Promise<object>} Slack response (includes `ok` and `ts`).
 */
export async function sendMsg(id, text, username = 'ATABot', icon_emoji = ':memo:') {
    const res = await slackClient.chat.postMessage({
        channel: id,
        text,
        username,
        icon_emoji,
    });
    return res;
}

/**
 * 
 *//**
* Send a FILE to a channel or DM and attach it to a thread.
* Flow:
*  1) post an initial message and obtain its `ts`.
*  2) upload the file with `files.uploadV2` using `thread_ts` so the file appears in the thread.
*
* Notes:
*  - `id` accepts channel or dm id.
*
* @param {string} id  channel or dm id where the file will be sent.
* @param {Buffer} fileBuffer  Buffer containing file bytes.
* @param {string} fileName  Filename as it will appear in Slack.
* @param {string} username  Display name for the initial message.
* @param {string} icon_emoji  Emoji for the initial message avatar.
* @returns {Promise<object>} Slack upload response.
*/
export async function sendFile(channel, fileName, fileBuffer, username = 'ATABot', icon_emoji = ':memo:') {
    try {
        // post message first and capture result
        const msg = await sendMsg(channel, `Aqui está a ATA da reunião: ${fileName}`, username, icon_emoji);
        if (!msg.ok) throw new Error('Error posting message: ' + (msg.error || 'unknown'));

        const res = await slackClient.files.uploadV2({
            // channel_id: id,
            channel: channel,
            // file: fileBuffer,
            content: fileBuffer,
            // filetype: "md",
            filename: `${fileName}.md`,
            title: fileName,
            thread_ts: msg.ts,
        });

        if (!res.ok) throw new Error('Error uploading file: ' + (res.error || 'unknown'));
        return res;
    } catch (err) {
        console.error('sendFile error:', err);
        throw err;
    }
}

/**
 * GET user ID by email.
 * - Requires `users:read.email` scope on the Slack app.
 *
 * @param {string} email  The user's email (must exist in the workspace).
 * @returns {Promise<{id:string, name:string}>}  Object with user id and real name.
 * @throws If the Slack API call fails or the user is not found.
 */
export async function getUserByEmail(email) {
    const res = await slackClient.users.lookupByEmail({ email });
    if (!res.ok) throw new Error(res.error);
    return {
        id: res.user.id,
        name: res.user.real_name
    };
}

/**
 *  GET DM  ID..
 * - Uses `conversations.open({ users: userId })` which returns the DM channel.id.
 *
 * @param {string} userId  The Slack user ID (e.g. 'U01ABC...').
 * @returns {Promise<string>} The DM channel id.
 */
export async function getDMId(userId) {
    const res = await slackClient.conversations.open({ users: userId });
    if (!res.ok) throw new Error(res.error);
    return res.channel.id;
}

/**
 * GET channel ID by name
 * - Pages through results (limit=200) until a match is found.
 * - Includes both public and private channels; for private channels the bot must be invited.
 * - Returns the channel.id when found.
 *
 * @param {string} channelName  Channel name (without '#').
 * @returns {Promise<string>} Channel ID (e.g. 'C01ABC...').
 * @throws If the channel is not found or the API call fails.
 */
export async function getChannelId(channelName) {
    let cursor;
    do {
        const res = await slackClient.conversations.list({
            exclude_archived: true,
            limit: 200,
            cursor,
            types: 'public_channel,private_channel'
        });

        if (!res.ok) throw new Error('Error fetching channels: ' + res.error);

        const channel = res.channels.find(c => c.name === channelName);
        if (channel) return channel.id;

        cursor = res.response_metadata?.next_cursor;
    } while (cursor);

    throw new Error(`Channel "${channelName}" not found.Note: if it's a private channel, make sure the bot was invited to it.`);
}

/**
 *  GET the first admin or owner of a channel.
 * - Fetches channel members via `conversations.members` and checks each user with `users.info`.
 * - Returns an object with useful info (id, name, username, email).
 * - Note: this may perform many API calls (one users.info per member).
 *
 * @param {string} channelId  The channel ID.
 * @returns {Promise<null|{id:string,name:string,username:string,email?:string,icon_emoji:string}>}
 */
export async function getChannelAdmin(channelId) {
    const membersRes = await slackClient.conversations.members({ channel: channelId });
    if (!membersRes.ok) throw new Error('Error fetching channel members');

    for (const userId of membersRes.members) {
        const userRes = await slackClient.users.info({ user: userId });
        if (!userRes.ok) continue;

        const user = userRes.user;
        if (user.is_admin || user.is_owner) {
            return {
                id: user.id,
                name: user.real_name,
                username: user.profile.display_name || user.real_name,
                email: user.profile.email,
                icon_emoji: ':bust_in_silhouette:' // optional: emoji as avatar
            };
        }
    }

    return null; // No admin found
}

/**
 * Local test helper: resolves ids, reads a file from ./test/ and sends messages/files.
 * - Uses environment variables USER_EMAIL and CHANNEL_NAME for testing.
 * - Do not run in production without reviewing.
 */

async function tests() {

    const email = process.env.USER_EMAIL;
    const channel = process.env.CHANNEL_NAME;

    const channelId = await getChannelId(channel)                              //GET CHANNEL id.
    const admin = await getChannelAdmin(channelId);
    const botName = admin.username || 'ATABot'

    const userData = await getUserByEmail(email);                              //GET user NAME and ID.
    const userId = await getDMId(userData.id);                                              //GET user DM id.

    const fileName = 'AtaFormatadaExemplo.docx';
    const fileBuffer = readFileSync('./test/' + fileName);



    await sendMsg(channelId, `Olá <@${userData.id}> Verifique <#${channelId}>!`, botName);           //Send MSG to a CHANNEL

    await sendFile(channelId, fileBuffer, fileName, botName);                                     //Send FILE to a CHANNEL

    await sendMsg(userId, `Olá <@${userData.id}> Verifique <#${channelId}>!`, botName);              //Send MSG to a USER

    await sendFile(userId, fileBuffer, fileName, botName);                                        //Send FILE to a USER



}


// Run local tests (uncomment to execute during local development)
//tests()