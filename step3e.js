const fs = require('fs');

let dash = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');

const targetEmpty = /reviews\.length === 0 \? \([\s\S]*?\}\)\n              <\/div>\n            \)\}/m;

const newEmpty = `reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0a0a0a] border border-[var(--color-border)] flex items-center justify-center mb-6">
                  <FileCode size={28} className="text-[#616161]" />
                </div>
                <h3 className="text-[15px] font-bold text-[#e8e8e8] mb-2">No recent reviews</h3>
                <p className="text-[13px] text-[#898989] max-w-sm mb-6">When you trigger code reviews, they will appear here.</p>
                <Link href="/dashboard/reviews/new" className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-[#e8e8e8] rounded-md text-[13px] font-medium tracking-wide transition-colors">
                  New Review
                </Link>
              </div>
            )}`;

dash = dash.replace(targetEmpty, newEmpty);
fs.writeFileSync('client/src/app/dashboard/page.tsx', dash);
