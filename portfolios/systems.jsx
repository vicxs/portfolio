// Variation 3: Engineering Minimal
// Dark, technical, dashboard-adjacent but NOT a dashboard
// Inter + JetBrains Mono. Near-black bg, hairline grid, single accent.

const SystemsStyles = {
  bg: '#0E0F11',
  panel: '#15171A',
  panel2: '#1B1E22',
  ink: '#E8E6E1',
  ink2: '#C4C0B8',
  muted: '#7A766E',
  rule: 'rgba(255,255,255,0.08)',
  ruleSoft: 'rgba(255,255,255,0.04)',
  accent: '#7DD3C0',
  accentDim: 'rgba(125,211,192,0.15)',
  sans: '"Inter", -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

function SystemsKV({ k, v, accent }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${SystemsStyles.ruleSoft}`,
      fontFamily: SystemsStyles.mono,
      fontSize: 12,
    }}>
      <span style={{ color: SystemsStyles.muted }}>{k}</span>
      <span style={{ color: accent ? SystemsStyles.accent : SystemsStyles.ink }}>{v}</span>
    </div>
  );
}

function SystemsSectionHead({ id, label, count }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '14px 32px',
      borderTop: `1px solid ${SystemsStyles.rule}`,
      borderBottom: `1px solid ${SystemsStyles.rule}`,
      background: SystemsStyles.panel,
      fontFamily: SystemsStyles.mono,
      fontSize: 11,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
    }}>
      <span style={{ color: SystemsStyles.accent }}>{id}</span>
      <span style={{ color: SystemsStyles.muted }}>/</span>
      <span style={{ color: SystemsStyles.ink, flex: 1 }}>{label}</span>
      {count != null && <span style={{ color: SystemsStyles.muted }}>{count} items</span>}
    </div>
  );
}

function SystemsPortfolio() {
  const v = window.VICTOR;
  return (
    <div style={{
      background: SystemsStyles.bg,
      color: SystemsStyles.ink,
      fontFamily: SystemsStyles.sans,
      width: '100%',
      minHeight: 1600,
      fontSize: 14,
      lineHeight: 1.55,
      backgroundImage: `linear-gradient(${SystemsStyles.ruleSoft} 1px, transparent 1px), linear-gradient(90deg, ${SystemsStyles.ruleSoft} 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
    }}>
      {/* Status bar */}
      <div style={{
        padding: '12px 32px',
        borderBottom: `1px solid ${SystemsStyles.rule}`,
        background: SystemsStyles.bg,
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: SystemsStyles.mono,
        fontSize: 11,
        color: SystemsStyles.muted,
        letterSpacing: '0.06em',
      }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <span style={{ color: SystemsStyles.ink }}>victoresteban.dev</span>
          <span>~/portfolio</span>
          <span>main</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: SystemsStyles.accent,
            boxShadow: `0 0 8px ${SystemsStyles.accent}`,
          }}></span>
          <span style={{ color: SystemsStyles.accent }}>open to consulting</span>
          <span>·</span>
          <span>{v.location}</span>
        </div>
      </div>

      {/* HERO */}
      <section style={{
        padding: '88px 32px 64px',
        position: 'relative',
      }}>
        <div style={{
          fontFamily: SystemsStyles.mono,
          fontSize: 11,
          letterSpacing: '0.12em',
          color: SystemsStyles.accent,
          marginBottom: 24,
        }}>
          <span style={{ color: SystemsStyles.muted }}>$</span> whoami --verbose
        </div>

        <h1 style={{
          fontFamily: SystemsStyles.sans,
          fontSize: 96,
          fontWeight: 500,
          letterSpacing: '-0.045em',
          lineHeight: 0.95,
          margin: 0,
          color: SystemsStyles.ink,
        }}>
          Victor Esteban<span style={{ color: SystemsStyles.accent }}>.</span>
        </h1>

        <div style={{
          marginTop: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          fontFamily: SystemsStyles.mono,
          fontSize: 13,
        }}>
          <span style={{
            background: SystemsStyles.accentDim,
            color: SystemsStyles.accent,
            padding: '4px 10px',
            borderRadius: 2,
            border: `1px solid ${SystemsStyles.accent}`,
          }}>SOFTWARE_ENGINEER</span>
          <span style={{ color: SystemsStyles.muted }}>·</span>
          <span style={{ color: SystemsStyles.ink2 }}>backend / integration / production</span>
        </div>

        <div style={{
          marginTop: 56,
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 48,
          alignItems: 'start',
        }}>
          <p style={{
            fontSize: 22,
            lineHeight: 1.5,
            color: SystemsStyles.ink2,
            margin: 0,
            fontWeight: 400,
            letterSpacing: '-0.01em',
            maxWidth: 720,
          }}>
            I turn ideas into well-implemented solutions — shipping reliable software, improving systems through observability, and using AI to deliver more value to clients.
          </p>

          {/* System card */}
          <div style={{
            background: SystemsStyles.panel,
            border: `1px solid ${SystemsStyles.rule}`,
            padding: '20px 24px',
            fontFamily: SystemsStyles.mono,
          }}>
            <div style={{
              fontSize: 10,
              letterSpacing: '0.12em',
              color: SystemsStyles.muted,
              marginBottom: 12,
            }}>// SYSTEM_INFO</div>
            <SystemsKV k="role" v="software engineer" />
            <SystemsKV k="location" v={v.location} />
            <SystemsKV k="experience" v="5+ years" />
            <SystemsKV k="status" v="● available" accent />
            <SystemsKV k="languages" v="ES · EN" />
            <div style={{
              marginTop: 16,
              display: 'flex',
              gap: 8,
            }}>
              <a style={{
                flex: 1,
                background: SystemsStyles.accent,
                color: SystemsStyles.bg,
                padding: '10px 14px',
                fontSize: 11,
                letterSpacing: '0.08em',
                textAlign: 'center',
                textDecoration: 'none',
                fontWeight: 600,
              }}>CONTACT →</a>
              <a style={{
                flex: 1,
                border: `1px solid ${SystemsStyles.rule}`,
                color: SystemsStyles.ink,
                padding: '10px 14px',
                fontSize: 11,
                letterSpacing: '0.08em',
                textAlign: 'center',
                textDecoration: 'none',
              }}>CV.PDF</a>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <SystemsSectionHead id="01" label="// about" />
      <section style={{ padding: '48px 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: 48,
        }}>
          <div style={{
            fontFamily: SystemsStyles.mono,
            fontSize: 11,
            color: SystemsStyles.muted,
            letterSpacing: '0.08em',
            lineHeight: 1.8,
          }}>
            ABOUT.md<br />
            <span style={{ color: SystemsStyles.accent }}>2 paragraphs</span><br />
            ~ 90s read
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 48,
            maxWidth: 1000,
          }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: SystemsStyles.ink2 }}>{v.about[0]}</p>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: SystemsStyles.ink2 }}>{v.about[1]}</p>
          </div>
        </div>
      </section>

      {/* STRENGTHS */}
      <SystemsSectionHead id="02" label="// strengths" count={v.strengths.length} />
      <section style={{ padding: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          border: `1px solid ${SystemsStyles.rule}`,
          background: SystemsStyles.panel,
        }}>
          {v.strengths.map((s, i) => (
            <div key={s} style={{
              padding: '24px 20px',
              borderRight: (i + 1) % 4 !== 0 ? `1px solid ${SystemsStyles.rule}` : 'none',
              borderBottom: i < 4 ? `1px solid ${SystemsStyles.rule}` : 'none',
              minHeight: 120,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div style={{
                fontFamily: SystemsStyles.mono,
                fontSize: 10,
                color: SystemsStyles.accent,
                letterSpacing: '0.12em',
              }}>S{String(i + 1).padStart(2, '0')}</div>
              <div style={{
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: SystemsStyles.ink,
                marginTop: 24,
              }}>{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SKILLS */}
      <SystemsSectionHead id="03" label="// stack" />
      <section style={{ padding: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}>
          {v.skills.map(g => (
            <div key={g.group} style={{
              border: `1px solid ${SystemsStyles.rule}`,
              background: SystemsStyles.panel,
              padding: '20px 24px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: `1px solid ${SystemsStyles.rule}`,
              }}>
                <span style={{
                  fontFamily: SystemsStyles.mono,
                  fontSize: 11,
                  color: SystemsStyles.accent,
                  letterSpacing: '0.1em',
                }}>{g.group.toUpperCase()}</span>
                <span style={{
                  fontFamily: SystemsStyles.mono,
                  fontSize: 11,
                  color: SystemsStyles.muted,
                }}>{g.items.length}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {g.items.map(it => (
                  <span key={it} style={{
                    fontFamily: SystemsStyles.mono,
                    fontSize: 12,
                    color: SystemsStyles.ink,
                    padding: '5px 10px',
                    border: `1px solid ${SystemsStyles.rule}`,
                    background: SystemsStyles.panel2,
                  }}>{it}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EXPERIENCE */}
      <SystemsSectionHead id="04" label="// selected_work" />
      <section style={{ padding: '32px' }}>
        {v.experiences.filter(e => e.tier === 'main').map((exp, i) => (
          <article key={exp.company} style={{
            border: `1px solid ${SystemsStyles.rule}`,
            marginBottom: 16,
            background: SystemsStyles.panel,
          }}>
            {/* header bar */}
            <div style={{
              padding: '14px 24px',
              borderBottom: `1px solid ${SystemsStyles.rule}`,
              background: SystemsStyles.panel2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: SystemsStyles.mono,
              fontSize: 11,
              letterSpacing: '0.08em',
              color: SystemsStyles.muted,
            }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ color: SystemsStyles.accent }}>case_{String(i + 1).padStart(2, '0')}.md</span>
                <span>·</span>
                <span>{exp.period}</span>
                <span>·</span>
                <span>{exp.location}</span>
              </div>
              <span style={{ color: SystemsStyles.ink }}>{exp.role}</span>
            </div>

            <div style={{
              padding: '32px 24px',
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              gap: 32,
            }}>
              <div>
                <h3 style={{
                  fontSize: 36,
                  fontWeight: 500,
                  letterSpacing: '-0.025em',
                  margin: '0 0 6px',
                  color: SystemsStyles.ink,
                  lineHeight: 1.05,
                }}>{exp.company}</h3>
                {exp.client && (
                  <div style={{
                    fontFamily: SystemsStyles.mono,
                    fontSize: 12,
                    color: SystemsStyles.accent,
                    marginBottom: 16,
                  }}>↳ {exp.client}</div>
                )}
                <p style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  color: SystemsStyles.ink2,
                  margin: 0,
                }}>{exp.summary}</p>
              </div>
              <div>
                <div style={{
                  fontFamily: SystemsStyles.mono,
                  fontSize: 10,
                  color: SystemsStyles.muted,
                  letterSpacing: '0.12em',
                  marginBottom: 12,
                }}>// CONTRIBUTIONS</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {exp.bullets.map((b, j) => (
                    <li key={j} style={{
                      display: 'grid',
                      gridTemplateColumns: '24px 1fr',
                      gap: 12,
                      padding: '10px 0',
                      borderBottom: `1px solid ${SystemsStyles.ruleSoft}`,
                      fontSize: 14,
                      color: SystemsStyles.ink2,
                      lineHeight: 1.55,
                    }}>
                      <span style={{
                        fontFamily: SystemsStyles.mono,
                        fontSize: 11,
                        color: SystemsStyles.accent,
                        paddingTop: 2,
                      }}>▸</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}

        {/* secondary table */}
        <div style={{
          marginTop: 32,
          border: `1px solid ${SystemsStyles.rule}`,
          background: SystemsStyles.panel,
        }}>
          <div style={{
            padding: '14px 24px',
            borderBottom: `1px solid ${SystemsStyles.rule}`,
            fontFamily: SystemsStyles.mono,
            fontSize: 11,
            letterSpacing: '0.1em',
            color: SystemsStyles.muted,
          }}>// EARLIER_ROLES</div>
          {v.experiences.filter(e => e.tier === 'secondary').map((e, i, arr) => (
            <div key={e.company} style={{
              display: 'grid',
              gridTemplateColumns: '160px 200px 120px 1fr',
              gap: 24,
              padding: '16px 24px',
              borderBottom: i < arr.length - 1 ? `1px solid ${SystemsStyles.ruleSoft}` : 'none',
              fontSize: 14,
              alignItems: 'baseline',
            }}>
              <span style={{ fontWeight: 500, color: SystemsStyles.ink }}>{e.company}</span>
              <span style={{ color: SystemsStyles.ink2 }}>{e.role}</span>
              <span style={{ fontFamily: SystemsStyles.mono, fontSize: 12, color: SystemsStyles.muted }}>{e.period}</span>
              <span style={{ color: SystemsStyles.muted }}>{e.summary}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECTS */}
      <SystemsSectionHead id="05" label="// personal_projects" count={v.projects.length} />
      <section style={{ padding: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
        }}>
          {v.projects.map((p, i) => (
            <div key={p.title} style={{
              border: `1px solid ${SystemsStyles.rule}`,
              background: SystemsStyles.panel,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <div style={{
                fontFamily: SystemsStyles.mono,
                fontSize: 10,
                color: SystemsStyles.accent,
                letterSpacing: '0.12em',
              }}>PROJ_{String(i + 1).padStart(2, '0')}</div>
              <h3 style={{
                fontSize: 20,
                fontWeight: 500,
                letterSpacing: '-0.015em',
                margin: 0,
                color: SystemsStyles.ink,
                lineHeight: 1.2,
              }}>{p.title}</h3>
              <p style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.55,
                color: SystemsStyles.ink2,
              }}>{p.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CERTS */}
      <SystemsSectionHead id="06" label="// credentials" />
      <section style={{ padding: '32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}>
          <div style={{
            border: `1px solid ${SystemsStyles.rule}`,
            background: SystemsStyles.panel,
            padding: '24px',
          }}>
            <div style={{
              fontFamily: SystemsStyles.mono,
              fontSize: 11,
              color: SystemsStyles.accent,
              letterSpacing: '0.12em',
              marginBottom: 16,
            }}>CERTIFICATIONS</div>
            {v.certifications.map(c => (
              <div key={c} style={{
                padding: '12px 0',
                borderBottom: `1px solid ${SystemsStyles.ruleSoft}`,
                display: 'grid',
                gridTemplateColumns: '24px 1fr',
                gap: 12,
                fontSize: 14,
                color: SystemsStyles.ink2,
              }}>
                <span style={{ color: SystemsStyles.accent, fontFamily: SystemsStyles.mono }}>✓</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <div style={{
            border: `1px solid ${SystemsStyles.rule}`,
            background: SystemsStyles.panel,
            padding: '24px',
          }}>
            <div style={{
              fontFamily: SystemsStyles.mono,
              fontSize: 11,
              color: SystemsStyles.accent,
              letterSpacing: '0.12em',
              marginBottom: 16,
            }}>EDUCATION</div>
            <div style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: '-0.015em',
              color: SystemsStyles.ink,
              lineHeight: 1.2,
            }}>{v.education.school}</div>
            <div style={{
              marginTop: 12,
              fontSize: 14,
              color: SystemsStyles.ink2,
            }}>{v.education.degree}</div>
            <div style={{
              fontFamily: SystemsStyles.mono,
              fontSize: 12,
              color: SystemsStyles.muted,
              marginTop: 4,
            }}>{v.education.track}</div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <SystemsSectionHead id="07" label="// contact" />
      <section style={{ padding: '64px 32px' }}>
        <h2 style={{
          fontSize: 56,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          margin: '0 0 40px',
          color: SystemsStyles.ink,
          lineHeight: 1.05,
          maxWidth: 880,
        }}>
          Looking for a backend engineer who can <span style={{ color: SystemsStyles.accent }}>own production</span>?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          border: `1px solid ${SystemsStyles.rule}`,
          background: SystemsStyles.panel,
        }}>
          {[
            ['EMAIL', v.email],
            ['LINKEDIN', '/in/victoresteban'],
            ['GITHUB', '/victoresteban'],
            ['LOCATION', v.location],
          ].map(([k, val], i) => (
            <div key={k} style={{
              padding: '24px 20px',
              borderRight: i < 3 ? `1px solid ${SystemsStyles.rule}` : 'none',
            }}>
              <div style={{
                fontFamily: SystemsStyles.mono,
                fontSize: 10,
                letterSpacing: '0.12em',
                color: SystemsStyles.muted,
                marginBottom: 8,
              }}>{k}</div>
              <div style={{
                fontFamily: SystemsStyles.mono,
                fontSize: 13,
                color: SystemsStyles.ink,
              }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 64,
          paddingTop: 24,
          borderTop: `1px solid ${SystemsStyles.rule}`,
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: SystemsStyles.mono,
          fontSize: 11,
          color: SystemsStyles.muted,
          letterSpacing: '0.08em',
        }}>
          <span>victoresteban@2026 · build_id: 1.0.0</span>
          <span>uptime: ∞</span>
        </div>
      </section>
    </div>
  );
}

window.SystemsPortfolio = SystemsPortfolio;
