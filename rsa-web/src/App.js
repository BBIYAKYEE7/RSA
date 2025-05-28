import React, { useState, useEffect } from "react";
import "./App.css";

// 최대공약수 (BigInt)
function gcd(a, b) {
  a = BigInt(a);
  b = BigInt(b);
  return b === 0n ? a : gcd(b, a % b);
}

// 모듈러 역원 (확장 유클리드, BigInt)
function modInverse(e, phi) {
  let [a, b] = [phi, e];
  let [x0, x1] = [0n, 1n];
  while (b !== 0n) {
    let q = a / b;
    [a, b] = [b, a % b];
    [x0, x1] = [x1, x0 - q * x1];
  }
  return x0 < 0n ? x0 + phi : x0;
}

// 모듈러 거듭제곱 (BigInt)
function modPow(base, exp, mod) {
  base = BigInt(base);
  exp = BigInt(exp);
  mod = BigInt(mod);
  let result = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * base) % mod;
    exp = exp / 2n;
    base = (base * base) % mod;
  }
  return result;
}

// 소수 판별 함수 (Number)
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

// min~max 범위의 무작위 소수 생성 (Number)
function randomPrime(min, max) {
  let prime = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (isPrime(n)) {
      prime = n;
      break;
    }
  }
  return prime;
}

// LaTeX 수식 span
function latex(str) {
  return `<span style="font-size:1.1em;">\\(${str}\\)</span>`;
}

// 애니메이션 팝업(모달) 컴포넌트
function Popup({ open, message, onClose }) {
  const [visible, setVisible] = useState(open);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldOpen, setShouldOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setIsClosing(false);
      setTimeout(() => setShouldOpen(true), 10); // 한 프레임 뒤에 open
    } else if (visible) {
      setIsClosing(true);
      setShouldOpen(false);
      const timer = setTimeout(() => {
        setVisible(false);
        setIsClosing(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open, visible]);

  if (!visible) return null;

  return (
    <div
      className={
        "popup-backdrop" +
        (shouldOpen && !isClosing ? " open" : "") +
        (isClosing ? " close" : "")
      }
    >
      <div
        className={
          "popup-modal" +
          (shouldOpen && !isClosing ? " open" : "") +
          (isClosing ? " close" : "")
        }
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(10px)",
          padding: "28px 32px",
          borderRadius: 8,
          boxShadow: "0 2px 16px #0002",
          minWidth: 260,
        }}
      >
        <div style={{ marginBottom: 18, fontSize: "1.08em" }}>{message}</div>
        <button
          onClick={() => {
            setIsClosing(true);
            setShouldOpen(false);
            setTimeout(() => {
              onClose();
            }, 350);
          }}
          style={{ padding: "6px 18px" }}
        >
          확인
        </button>
      </div>
    </div>
  );
}

function App() {
  const [p, setP] = useState("");
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  const [encryptSteps, setEncryptSteps] = useState([]);
  const [crtSteps, setCrtSteps] = useState([]);
  const [primeType, setPrimeType] = useState("2digit");
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupMsg, setPopupMsg] = useState("");
  const [manualInput, setManualInput] = useState(false);

  useEffect(() => {
    if (window.MathJax && (encryptSteps.length > 0 || crtSteps.length > 0)) {
      window.MathJax.typesetPromise();
    }
  }, [encryptSteps, crtSteps]);

  const showPopup = msg => {
    setPopupMsg(msg);
    setPopupOpen(true);
  };

  const handleRandomPrimes = () => {
    let min, max;
    if (primeType === "2digit") {
      min = 11; max = 97;
    } else if (primeType === "16bit") {
      min = 32768; max = 65535;
    } else if (primeType === "32bit") {
      min = 2147483648; max = 4294967295;
    }
    let rp = randomPrime(min, max);
    let rq = randomPrime(min, max);
    while (rp === rq) {
      rq = randomPrime(min, max);
    }
    setP(rp);
    setQ(rq);
  };

  const handleRSA = () => {
    const P = BigInt(p);
    const Q = BigInt(q);
    const m = BigInt(message);

    if (!P || !Q || !m) {
      showPopup("p, q, 평문을 모두 입력하세요.");
      return;
    }

    if (manualInput) {
      if (!isPrime(Number(P))) {
        showPopup("p가 소수가 아닙니다.");
        return;
      }
      if (!isPrime(Number(Q))) {
        showPopup("q가 소수가 아닙니다.");
        return;
      }
      if (P === Q) {
        showPopup("p와 q는 서로 달라야 합니다.");
        return;
      }
    }

    const n = P * Q;
    if (m >= n) {
      showPopup(`평문이 n보다 작아야 합니다. (현재 n = ${n})`);
      return;
    }

    const phi = (P - 1n) * (Q - 1n);

    let e = 3n;
    while (e < phi && gcd(e, phi) !== 1n) e += 2n;

    const d = modInverse(e, phi);
    const c = modPow(m, e, n);

    setEncryptSteps([
      latex(`n = p \\times q = ${P} \\times ${Q} = ${n}`),
      latex(`\\varphi(n) = (p-1) \\times (q-1) = ${P - 1n} \\times ${Q - 1n} = ${phi}`),
      latex(`e: 1 < e < \\varphi(n),\\ \\gcd(e,\\varphi(n)) = 1\\ \\Rightarrow\\ e = ${e}`),
      latex(`d = e^{-1} \\bmod \\varphi(n) = ${d}`),
      latex(`\\text{공개키: } (e, n) = (${e}, ${n}),\\ \\text{개인키: } (d, n) = (${d}, ${n})`),
      latex(`\\text{암호문 } c = m^e \\bmod n = ${m}^{${e}} \\bmod ${n} = ${c}`),
    ]);

    const dp = d % (P - 1n);
    const dq = d % (Q - 1n);
    const qinv = modInverse(Q, P);
    const m1 = modPow(c, dp, P);
    const m2 = modPow(c, dq, Q);
    const h = (qinv * ((m1 - m2 + P) % P)) % P;
    const m_crt = (m2 + h * Q) % n;

    setCrtSteps([
      latex(`d_p = d \\bmod (p-1) = ${d} \\bmod ${P - 1n} = ${dp}`),
      latex(`d_q = d \\bmod (q-1) = ${d} \\bmod ${Q - 1n} = ${dq}`),
      latex(`q_{inv} = q^{-1} \\bmod p = ${Q}^{-1} \\bmod ${P} = ${qinv}`),
      latex(`m_1 = c^{d_p} \\bmod p = ${c}^{${dp}} \\bmod ${P} = ${m1}`),
      latex(`m_2 = c^{d_q} \\bmod q = ${c}^{${dq}} \\bmod ${Q} = ${m2}`),
      latex(`h = q_{inv} \\times (m_1 - m_2) \\bmod p = ${qinv} \\times (${m1} - ${m2}) \\bmod ${P} = ${h}`),
      latex(`\\text{CRT 공식: } m = m_2 + h \\times q \\bmod n`),
      latex(`m = ${m2} + ${h} \\times ${Q} \\bmod ${n} = ${m_crt}`),
      latex(`\\text{복호화 결과: } ${m_crt}`),
    ]);
  };

  return (
    <div className="App">
      <Popup open={popupOpen} message={popupMsg} onClose={() => setPopupOpen(false)} />
      <div className="main-content">
        <h2>RSA 암호화/복호화 (CRT 과정 포함, LaTeX 수식)</h2>
        <div style={{marginBottom: 8}}>
          <label>
            <input
              type="checkbox"
              checked={manualInput}
              onChange={e => {
                setManualInput(e.target.checked);
                setP("");
                setQ("");
              }}
              style={{ marginRight: 6 }}
            />
            소수 직접 입력
          </label>
          {!manualInput && (
            <>
              &nbsp;
              <label>
                <input
                  type="radio"
                  name="primeType"
                  value="2digit"
                  checked={primeType === "2digit"}
                  onChange={() => setPrimeType("2digit")}
                /> 2자리 이상 소수
              </label>
              &nbsp;
              <label>
                <input
                  type="radio"
                  name="primeType"
                  value="16bit"
                  checked={primeType === "16bit"}
                  onChange={() => setPrimeType("16bit")}
                /> 16비트 소수
              </label>
              &nbsp;
              <label>
                <input
                  type="radio"
                  name="primeType"
                  value="32bit"
                  checked={primeType === "32bit"}
                  onChange={() => setPrimeType("32bit")}
                /> 32비트 소수
              </label>
            </>
          )}
        </div>
        {!manualInput && (
          <button onClick={handleRandomPrimes} style={{ marginBottom: 10 }}>
            무작위 소수 생성
          </button>
        )}
        <div>
          <b>p:</b>{" "}
          <input
            value={p}
            onChange={e => setP(e.target.value)}
            type="number"
            disabled={!manualInput && true}
            style={{ width: 120, marginRight: 16 }}
            placeholder="p"
          />
          <b>q:</b>{" "}
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            type="number"
            disabled={!manualInput && true}
            style={{ width: 120 }}
            placeholder="q"
          />
        </div>
        <div>
          <label>
            평문(정수):{" "}
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              type="number"
            />
          </label>
        </div>
        <button onClick={handleRSA} style={{ margin: "10px 0", display: "block", marginLeft: "auto", marginRight: "auto" }}>
          암호화 및 CRT 복호화 과정 보기
        </button>
        {(encryptSteps.length > 0 || crtSteps.length > 0) && (
          <div className="result-box">
            <h3>암호화 과정</h3>
            <ul>
              {encryptSteps.map((step, idx) => (
                <li key={idx} style={{ listStyle: "none", marginBottom: 6 }}>
                  <div dangerouslySetInnerHTML={{ __html: step }} />
                </li>
              ))}
            </ul>
            <h3>CRT 복호화 과정</h3>
            <ul>
              {crtSteps.map((step, idx) => (
                <li key={idx} style={{ listStyle: "none", marginBottom: 6 }}>
                  <div dangerouslySetInnerHTML={{ __html: step }} />
                </li>
              ))}
            </ul>
            <div style={{marginTop: 10, color: "#888"}}>
              <b>※ 수식이 보이지 않으면 새로고침(F5) 또는 MathJax 환경을 확인하세요.</b>
            </div>
          </div>
        )}
      </div>
      <footer style={{
        marginTop: 40,
        padding: "18px 0 12px 0",
        color: "#888",
        fontSize: "0.98em",
        borderTop: "1px solid #eee",
        background: "transparent"
      }}>
        © {new Date().getFullYear()} RSA CRT Demo · Made by BBIYAKYEE7 and Changeon Lee
      </footer>
    </div>
  );
}

export default App;