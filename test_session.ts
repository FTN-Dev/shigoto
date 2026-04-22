import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
sb.from('tasks').select('user_id').then(res => {
  const ids = [...new Set(res.data.map(x => x.user_id))];
  console.log('Unique user IDs in tasks:', ids);
});
