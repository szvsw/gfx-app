import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {

  if (req.method === 'GET') {
    return res.json({message: "hello"})
  }
  return res.status(405).json({ message: 'Bad request: method not allowed.' })
}
