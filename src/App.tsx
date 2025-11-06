import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const API_BASE = "http://localhost:4000/api";

type Phase = "setup" | "register" | "authenticate";

export default function App() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [identity, setIdentity] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [factor, setFactor] = useState<any>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [challengeCode, setChallengeCode] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [verifyResult, setVerifyResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [challengeResult, setChallengeResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function createFactor() {
    setError("");
    setVerifyResult(null);
    setFactor(null);
    try {
      const resp = await fetch(`${API_BASE}/create-factor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, friendlyName })
      });
      const data = await resp.json();
      if (!resp.ok) {
        const errorMsg = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || JSON.stringify(data.error) || 'Failed to create factor';
        setError(errorMsg);
        return;
      }
      setFactor(data);
      setPhase("register");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function verifyFactor() {
    if (!factor) return;
    setError("");
    try {
      const resp = await fetch(`${API_BASE}/verify-factor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: factor.identity, factorSid: factor.factorSid, code: verifyCode })
      });
      const data = await resp.json();
      if (!resp.ok) {
        const errorMsg = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || 'Verification failed. Please check your code.';
        setError(errorMsg);
        return;
      }
      setVerifyResult(data);
      if (data.status === "verified" || data.updated?.status === "verified") {
        setPhase("authenticate");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  }

  async function challenge() {
    if (!factor) return;
    setError("");
    setChallengeResult(null);
    try {
      const resp = await fetch(`${API_BASE}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: factor.identity, factorSid: factor.factorSid, code: challengeCode })
      });
      const data = await resp.json();
      if (!resp.ok) {
        const errorMsg = typeof data.error === 'string' 
          ? data.error 
          : data.error?.message || 'Challenge failed';
        setError(errorMsg);
        return;
      }
      setChallengeResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Challenge failed');
    }
  }

  function resetFlow() {
    setPhase("setup");
    setIdentity("");
    setFriendlyName("");
    setFactor(null);
    setVerifyCode("");
    setChallengeCode("");
    setVerifyResult(null);
    setChallengeResult(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-light-gray py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-dark-blue mb-2">TOTP Authentication Demo</h1>
          <p className="text-gray-600">Powered by Twilio Verify API</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <StepIndicator
              number={1}
              title="Setup"
              active={phase === "setup"}
              completed={phase === "register" || phase === "authenticate"}
            />
            <div className="w-16 h-1 bg-gray-300">
              <div className={`h-full transition-all duration-500 ${phase !== "setup" ? "bg-danger" : "bg-gray-300"}`} />
            </div>
            <StepIndicator
              number={2}
              title="Register"
              active={phase === "register"}
              completed={phase === "authenticate"}
            />
            <div className="w-16 h-1 bg-gray-300">
              <div className={`h-full transition-all duration-500 ${phase === "authenticate" ? "bg-danger" : "bg-gray-300"}`} />
            </div>
            <StepIndicator
              number={3}
              title="Authenticate"
              active={phase === "authenticate"}
              completed={false}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-2 border-danger rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-danger" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {phase === "setup" && (
            <SetupPhase
              identity={identity}
              setIdentity={setIdentity}
              friendlyName={friendlyName}
              setFriendlyName={setFriendlyName}
              onCreateFactor={createFactor}
            />
          )}

          {phase === "register" && factor && (
            <RegisterPhase
              factor={factor}
              verifyCode={verifyCode}
              setVerifyCode={setVerifyCode}
              onVerify={verifyFactor}
              verifyResult={verifyResult}
            />
          )}

          {phase === "authenticate" && factor && (
            <AuthenticatePhase
              factor={factor}
              challengeCode={challengeCode}
              setChallengeCode={setChallengeCode}
              onChallenge={challenge}
              challengeResult={challengeResult}
              onReset={resetFlow}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Step Indicator Component
function StepIndicator({ number, title, active, completed }: { number: number; title: string; active: boolean; completed: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
          completed
            ? "bg-danger text-white"
            : active
            ? "bg-danger text-white ring-4 ring-danger/20"
            : "bg-white text-gray-600 border-2 border-gray-300"
        }`}
      >
        {completed ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <span className={`mt-2 text-sm font-medium ${active ? "text-danger" : "text-gray-500"}`}>{title}</span>
    </div>
  );
}

// Setup Phase Component
function SetupPhase({
  identity,
  setIdentity,
  friendlyName,
  setFriendlyName,
  onCreateFactor
}: {
  identity: string;
  setIdentity: (v: string) => void;
  friendlyName: string;
  setFriendlyName: (v: string) => void;
  onCreateFactor: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-dark-blue mb-6">Create TOTP Factor</h2>
      <p className="text-gray-600 mb-6">
        Start by creating a new TOTP factor. Enter a unique identity (like a user ID) to get started.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-blue mb-2">
            Identity <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={identity}
            onChange={(e) => {
              // Only allow alphanumeric characters and dashes
              const sanitized = e.target.value.replace(/[^a-zA-Z0-9-]/g, '');
              setIdentity(sanitized);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
            placeholder="user-1234"
            minLength={8}
            maxLength={64}
          />
          <p className="mt-1 text-sm text-gray-500">Use your internal user ID (8-64 characters, alphanumeric with dashes only)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-blue mb-2">
            Friendly Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={friendlyName}
            onChange={(e) => setFriendlyName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
            placeholder="My TOTP Account"
          />
        </div>

        <button
          onClick={onCreateFactor}
          disabled={!identity || identity.length < 8}
          className="w-full mt-6 bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-light-gray disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Create QR Code
        </button>
      </div>
    </div>
  );
}

// Register Phase Component
function RegisterPhase({
  factor,
  verifyCode,
  setVerifyCode,
  onVerify,
  verifyResult
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  factor: any;
  verifyCode: string;
  setVerifyCode: (v: string) => void;
  onVerify: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifyResult: any;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-dark-blue mb-6">Scan QR Code & Register</h2>
      <p className="text-gray-600 mb-6">
        Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code to verify.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* QR Code */}
        <div className="flex flex-col items-center justify-center bg-light-gray rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">QR Code</h3>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <QRCodeSVG value={factor.binding.uri} size={200} />
          </div>
          <p className="mt-4 text-sm text-gray-600 text-center">Scan with your authenticator app</p>
        </div>

        {/* Manual Secret */}
        <div className="flex flex-col justify-center bg-light-gray rounded-lg p-6">
          <h3 className="text-lg font-semibold text-dark-blue mb-4">Manual Entry</h3>
          <p className="text-sm text-gray-600 mb-3">If you can't scan, enter this secret manually:</p>
          <div className="bg-white p-4 rounded border border-gray-200 font-mono text-sm break-all">
            {factor.binding.secret}
          </div>
          <p className="mt-3 text-xs text-amber-600">
            ⚠️ Save this secret securely — it won't be shown again!
          </p>
        </div>
      </div>

      {/* Factor Details */}
      <div className="bg-primary/5 rounded-lg p-4 mb-6 border border-primary/20">
        <div className="text-sm space-y-1">
          <p>
            <span className="font-medium text-dark-blue">Identity:</span>{" "}
            <span className="text-dark-blue font-mono">{factor.identity}</span>
          </p>
          <p>
            <span className="font-medium text-dark-blue">Factor SID:</span>{" "}
            <span className="text-dark-blue font-mono text-xs">{factor.factorSid}</span>
          </p>
        </div>
      </div>

      {/* Verification Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-blue mb-2">
            Enter 6-digit code from your app
          </label>
          <input
            type="text"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-center text-2xl font-mono tracking-widest"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <button
          onClick={onVerify}
          disabled={verifyCode.length !== 6}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-light-gray disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Verify & Activate Factor
        </button>
      </div>

      {/* Verification Result */}
      {verifyResult && (
        <div className="mt-6">
          {verifyResult.status === "verified" || verifyResult.updated?.status === "verified" ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-green-900">Registration Successful!</p>
                  <p className="text-sm text-green-700">Your TOTP factor has been verified and activated.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                Status: <span className="font-mono">{verifyResult.status || verifyResult.updated?.status}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Authenticate Phase Component
function AuthenticatePhase({
  factor,
  challengeCode,
  setChallengeCode,
  onChallenge,
  challengeResult,
  onReset
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  factor: any;
  challengeCode: string;
  setChallengeCode: (v: string) => void;
  onChallenge: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  challengeResult: any;
  onReset: () => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-dark-blue mb-6">Authenticate with TOTP</h2>
      <p className="text-gray-600 mb-6">
        Your factor is now registered! Test the authentication by entering a code from your authenticator app.
      </p>

      {/* Success Badge */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-green-900">Factor Registered</p>
            <p className="text-sm text-green-700 font-mono">{factor.identity}</p>
          </div>
        </div>
      </div>

      {/* Challenge Input */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-blue mb-2">
            Enter current code from your authenticator app
          </label>
          <input
            type="text"
            value={challengeCode}
            onChange={(e) => setChallengeCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition text-center text-2xl font-mono tracking-widest"
            placeholder="000000"
            maxLength={6}
          />
        </div>

        <button
          onClick={onChallenge}
          disabled={challengeCode.length !== 6}
          className="w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-light-gray disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Verify Code
        </button>
      </div>

      {/* Challenge Result */}
      {challengeResult && (
        <div className="mt-6">
          {challengeResult.status === "approved" || challengeResult.challenge?.status === "approved" ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-green-900">Authentication Successful!</p>
                  <p className="text-sm text-green-700">The code was verified successfully.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border-2 border-danger rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-danger mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-danger">Authentication Failed</p>
                  <p className="text-sm text-danger">
                    Status: <span className="font-mono">{challengeResult.status || challengeResult.challenge?.status}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reset Button */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onReset}
          className="w-full bg-light-gray text-dark-blue py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          Start Over with New User
        </button>
      </div>
    </div>
  );
}
