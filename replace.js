const fs = require('fs');

const content = fs.readFileSync('client/src/app/dashboard/page.tsx', 'utf8');
const startMatch = '<div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] mb-8 stagger">';
const endMatch = '{/* Recent Reviews (Full Width) */}';

const startIdx = content.indexOf(startMatch);
const endIdx = content.indexOf(endMatch);

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find markers!", startIdx, endIdx);
  process.exit(1);
}

const replacement = `<div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] mb-8 stagger">
            {stats.map((stat, i) => (
              <GlowCard key={stat.label} className="p-5 flex flex-col justify-between h-[124px]" glowOpacity={0.06}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-[#898989] mb-3">
                  <stat.icon size={16} />
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <div className="text-2xl font-bold tabular-nums text-[#e8e8e8] min-h-[32px]">
                        {loading ? (
                          <span className="skeleton inline-block w-12 h-7 rounded-md" />
                        ) : stat.value === null ? (
                          <span className="text-[#616161] font-medium text-xl">—</span>
                        ) : stat.id === 'week' && stat.value === 0 ? (
                          <span className="text-[#616161]">0</span>
                        ) : (
                          <CountUp value={stat.value as number} duration={0.6 + i * 0.1} />
                        )}
                      </div>
                      {/* Delta stub */}
                      {!loading && stat.delta && stat.value !== 0 && stat.value !== null && (
                        <span className="text-[10px] font-medium text-[#22c55e] bg-[#22c55e]/10 px-1 py-0.5 rounded">
                          {stat.delta}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between group/week">
                      <p className="text-[10px] uppercase tracking-wider text-[#616161]">{stat.label}</p>
                      {/* Zero state hover action for This Week */}
                      {!loading && stat.id === 'week' && stat.value === 0 && (
                        <Link href="/dashboard/reviews/new" className="text-[10px] text-[#898989] hover:text-[#e8e8e8] opacity-0 group-hover/week:opacity-100 transition-opacity">
                          Start one →
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  {/* Sparkline in lower right */}
                  {!loading && stat.value !== null && stat.value !== 0 && (
                    <div className="mb-1 ml-4 shrink-0">
                      <Sparkline color={stat.color} />
                    </div>
                  )}
                </div>
              </GlowCard>
            ))}
          </div>\n\n        `;

const finalContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
fs.writeFileSync('client/src/app/dashboard/page.tsx', finalContent);
console.log("Done");
