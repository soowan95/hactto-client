import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useApp } from "../../context/AppContext";
import { API_BASE_URL } from "../../utils";
import { LottoBalls } from "../../components/LottoBall";
import type { WinningNumber } from "../../types";

export function Search() {
  const { appendAuth } = useApp();
  const [searchEpisode, setSearchEpisode] = useState("");
  const [searchResult, setSearchResult] = useState<WinningNumber | null>(null);
  const [searchError, setSearchError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allWinningNumbers, setAllWinningNumbers] = useState<WinningNumber[]>(
    [],
  );

  useEffect(() => {
    const fetchAllWinningNumbers = async () => {
      try {
        const res = await fetch(appendAuth(`${API_BASE_URL}/winning-numbers`));
        if (res.ok) {
          const data = await res.json();
          const result = (data.data || data || []) as WinningNumber[];
          const sorted = [...result].sort((a, b) => b.episode - a.episode);
          const drawnResults = sorted.filter((wn) => wn.isDrawn === true);
          setAllWinningNumbers(drawnResults);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWinningNumbers();
  }, [appendAuth]);

  const handleSearchEpisode = async (e: FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);
    if (!searchEpisode.trim() || isNaN(Number(searchEpisode))) {
      setSearchError("올바른 회차 번호를 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(
        appendAuth(`${API_BASE_URL}/winning-numbers/${searchEpisode}`),
      );
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`${searchEpisode}회차 당첨번호가 존재하지 않습니다.`);
        }
        throw new Error("회차 번호 검색 중 오류가 발생했습니다.");
      }
      const data = await res.json();
      const result = data.data || data;
      if (!result || !result.isDrawn) {
        throw new Error(
          `${searchEpisode}회차는 아직 추첨이 진행되지 않았습니다.`,
        );
      }
      setSearchResult(result as WinningNumber);
    } catch (err) {
      const error = err as Error;
      setSearchError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2
        className="access-title"
        style={{ fontSize: "1.3rem", marginBottom: "16px" }}
      >
        역대 로또 당첨번호 조회
      </h2>

      {/* Search Form */}
      <form
        onSubmit={handleSearchEpisode}
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "24px",
          background: "rgba(255,255,255,0.01)",
          padding: "16px",
          borderRadius: "12px",
          border: "var(--border-glass)",
        }}
      >
        <input
          type="text"
          className="input-glow"
          placeholder="검색할 회차 번호 입력 (예: 1000)"
          value={searchEpisode}
          onChange={(e) => setSearchEpisode(e.target.value)}
          disabled={submitting}
          style={{ flex: 1 }}
        />
        <button
          className="btn-submit"
          type="submit"
          disabled={submitting}
          style={{ whiteSpace: "nowrap" }}
        >
          {submitting ? "검색 중..." : "회차 검색"}
        </button>
      </form>

      {searchError && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          <span>⚠</span>
          <div>{searchError}</div>
        </div>
      )}

      {searchResult && (
        <div
          style={{
            background: "rgba(0, 240, 255, 0.03)",
            border: "1px solid rgba(0, 240, 255, 0.15)",
            padding: "20px",
            borderRadius: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              fontSize: "1.05rem",
              fontWeight: "bold",
              color: "var(--primary-cyan)",
              marginBottom: "14px",
            }}
          >
            제 {searchResult.episode}회 당첨번호 결과
          </div>
          <LottoBalls numbers={searchResult.numbers} />
        </div>
      )}

      {/* Previous list */}
      <h3
        style={{
          fontSize: "1rem",
          fontWeight: "bold",
          marginBottom: "12px",
          color: "var(--text-muted)",
        }}
      >
        최근 당첨 번호 내역
      </h3>
      <div className="scroll-y-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: "110px" }}>회차</th>
              <th>당첨 번호</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={2}
                  style={{ textAlign: "center", color: "var(--text-dim)" }}
                >
                  불러오는 중...
                </td>
              </tr>
            ) : allWinningNumbers.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  style={{ textAlign: "center", color: "var(--text-dim)" }}
                >
                  불러온 내역이 없습니다.
                </td>
              </tr>
            ) : (
              allWinningNumbers.slice(0, 20).map((wn) => (
                <tr key={wn.episode}>
                  <td
                    style={{ fontWeight: "bold", color: "var(--primary-cyan)" }}
                  >
                    {wn.episode}회
                  </td>
                  <td>
                    <LottoBalls numbers={wn.numbers} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Search;
