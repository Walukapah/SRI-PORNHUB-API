import { PornHub } from 'pornhub.js'

const pornhub = new PornHub()

export default async function handler(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing video URL (use ?url=)' })
  }

  try {
    const video = await pornhub.video(url)
    if (!video || !video.title) {
      return res.status(502).json({ error: 'Pornhub parsing failed or data missing' })
    }
    res.status(200).json(video)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch video info', details: err.message })
  }
}
