const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard/AdminPage.tsx', 'utf8');

// 1. Remove isAuthSuccessLocal state and checks
code = code.replace(/const \[isAuthSuccessLocal, setIsAuthSuccessLocal\] = useState\(false\);\n/g, '');
code = code.replace(/isAuthSuccessLocal \? '관리자 제어판' : '관리자 키 인증'/g, "'관리자 제어판'");
code = code.replace(/isOpen && isAuthSuccessLocal/g, 'true');

// 2. Remove modal body auth screen
// Find the exact string `{!isAuthSuccessLocal ? (` and its closing structure.
// This is somewhat manual, let's use a simpler regex for the body.
let startIndex = code.indexOf('{!isAuthSuccessLocal ? (');
if (startIndex !== -1) {
  let innerIndex = code.indexOf('/* Admin Control Panel Tab Screen */', startIndex);
  if (innerIndex !== -1) {
    let divIndex = code.indexOf('<div', innerIndex);
    code = code.slice(0, startIndex) + code.slice(divIndex);
  }
}

// Now find the closing of that ternary (it ends right before `<Alert alert={alert} />`)
// Around line 3400:
//           <Alert alert={alert} />
//         </div>
// )
let alertIndex = code.indexOf('<Alert alert={alert} />');
if (alertIndex !== -1) {
  // We need to find the `)` before it? No, the `)` is after `</div>`
  // Actually, the structure was:
  // {!isAuthSuccessLocal ? ( ... ) : ( <div ...> ... </div> )}
  // Let's replace the ending `)}`
  let endingStr = `          <Alert alert={alert} />\n        </div>\n      )\n    </div>\n\n    {/* Modal Footer */}\n    {isAuthSuccessLocal && (`;
  
  // We should just use string replacement
  code = code.replace(
    /          <Alert alert=\{alert\} \/>\n        <\/div>\n      \)\n/g,
    '          <Alert alert={alert} />\n        </div>\n'
  );
  
  code = code.replace(
    /        \{\/\* Modal Footer \*\/\}\n        \{isAuthSuccessLocal && \(/g,
    '        {/* Modal Footer */}\n        {true && ('
  );
}

// Also replace `isAdminMode` check
code = code.replace(
  /  const \{ isAdminMode \} = useApp\(\);/g,
  "  const { isAdminMode } = useApp();\n  useEffect(() => { if (!isAdminMode) navigate('/home'); }, [isAdminMode, navigate]);\n  if (!isAdminMode) return null;"
);

// We need to add the Notifications tab rendering logic
// Find the `</button>` for `HON_EVENTS` tab
let honEventsTabBtn = `onClick={() => setActiveTab('HON_EVENTS')}`;
let notiTabHtml = `
                <button
                  className={\`tab-btn \${activeTab === 'NOTIFICATIONS' ? 'active-tab' : ''}\`}
                  onClick={() => setActiveTab('NOTIFICATIONS')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    color:
                      activeTab === 'NOTIFICATIONS'
                        ? 'var(--primary-cyan)'
                        : 'var(--text-dim)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  알림 발송
                </button>
`;
code = code.replace(
  /                <\/button>\n              <\/div>/,
  `                </button>\n${notiTabHtml}\n              </div>`
);

// Add state for notifications
let algoState = `  const [activeTab, setActiveTab] = useState<`;
let notiStateStr = `
  const [notiTargetType, setNotiTargetType] = useState<'NICKNAME' | 'VISITOR_ID'>('NICKNAME');
  const [notiTarget, setNotiTarget] = useState('');
  const [notiTitle, setNotiTitle] = useState('');
  const [notiContent, setNotiContent] = useState('');

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notiTarget.trim() || !notiTitle.trim() || !notiContent.trim()) {
      showAlert('error', '모든 필드를 입력하세요.');
      return;
    }
    try {
      const res = await fetch(\`\${API_BASE_URL}/manager/notifications\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${adminKey}\`,
        },
        body: JSON.stringify({
          targetType: notiTargetType,
          target: notiTarget,
          title: notiTitle,
          content: notiContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '알림 전송 실패');
      showAlert('success', '알림을 전송했습니다.');
      setNotiTarget('');
      setNotiTitle('');
      setNotiContent('');
    } catch (err: any) {
      showAlert('error', err.message);
    }
  };
`;
code = code.replace(algoState, notiStateStr + algoState);

// Add the rendering for Notifications tab
let contentStr = `
                {activeTab === 'NOTIFICATIONS' && (
                  <div>
                    <h3 style={{ color: 'var(--primary-cyan)', marginBottom: '16px' }}>개별 알림 발송</h3>
                    <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={notiTargetType}
                          onChange={(e: any) => setNotiTargetType(e.target.value)}
                          className="input-glow"
                          style={{ padding: '8px' }}
                        >
                          <option value="NICKNAME">닉네임</option>
                          <option value="VISITOR_ID">Visitor ID</option>
                        </select>
                        <input
                          type="text"
                          value={notiTarget}
                          onChange={(e) => setNotiTarget(e.target.value)}
                          placeholder={notiTargetType === 'NICKNAME' ? '대상 닉네임' : '대상 Visitor ID'}
                          className="input-glow"
                          style={{ flex: 1 }}
                        />
                      </div>
                      <input
                        type="text"
                        value={notiTitle}
                        onChange={(e) => setNotiTitle(e.target.value)}
                        placeholder="알림 제목"
                        className="input-glow"
                      />
                      <textarea
                        value={notiContent}
                        onChange={(e) => setNotiContent(e.target.value)}
                        placeholder="알림 내용"
                        className="input-glow"
                        style={{ height: '100px', resize: 'vertical' }}
                      />
                      <button type="submit" className="btn-submit" style={{ padding: '12px' }}>
                        발송하기
                      </button>
                    </form>
                  </div>
                )}
`;
code = code.replace(/              <\/div>\n            <\/div>\n\n          <Alert alert=\{alert\} \/>/g, `              </div>\n            </div>\n${contentStr}\n          <Alert alert={alert} />`);

fs.writeFileSync('src/pages/Dashboard/AdminPage.tsx', code);
