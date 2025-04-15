const axios = require('axios');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing `text` field' });

  try {
    const ellResponse = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELL_VOICE_ID}`,
      { text, voice_settings: { stability: 0.7, similarity_boost: 0.75 } },
      {
        headers: {
          'xi-api-key': process.env.ELL_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const audioBuffer = Buffer.from(ellResponse.data);
    const filename = `audio/${uuidv4()}.mp3`;

    const s3 = new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    await s3.putObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: filename,
      Body: audioBuffer,
      ContentType: 'audio/mpeg',
      ACL: 'public-read'
    }).promise();

    const audioUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
    return res.status(200).json({ url: audioUrl });

  } catch (err) {
    console.error('TTS Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
