/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useApp } from '../../context/AppContext';
import { API_BASE_URL } from '../../utils';

interface PostComment {
  id: number;
  postId: number;
  visitorId: string;
  content: string;
  createdAt: string;
  visitor?: { nickname?: string | null };
  _count?: { likes: number };
  isLiked?: boolean;
  replies?: PostComment[];
  parentId?: number | null;
}

interface Post {
  id: number;
  visitorId: string;
  category: 'FREE' | 'KNOWHOW' | 'WINNING';
  title: string;
  content: string;
  imageUrl: string | null;
  lottoRank?: number;
  lottoRound?: number;
  createdAt: string;
  visitor?: { nickname?: string | null };
  _count?: { likes: number; comments: number };
  isLiked?: boolean;
  comments?: PostComment[];
}

export function Board() {
  const { showAlert, visitorId } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<'FREE' | 'KNOWHOW' | 'WINNING'>(
    'FREE',
  );
  const [sort, setSort] = useState<'latest' | 'likes'>('latest');
  const [rankFilter, setRankFilter] = useState<string>('');
  const [roundFilter, setRoundFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('all');
  const [activeSearchTarget, setActiveSearchTarget] = useState('all');
  const [loading, setLoading] = useState(false);

  // Form states
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Lotto OCR states
  const [winningImageUrl, setWinningImageUrl] = useState('');
  const [lottoAnalyzing, setLottoAnalyzing] = useState(false);
  const [lottoRank, setLottoRank] = useState<number | null>(null);
  const [lottoRound, setLottoRound] = useState<number | null>(null);
  const [lottoIdentifier, setLottoIdentifier] = useState<string | null>(null);
  const [lottoError, setLottoError] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Detail view state
  const [activePost, setActivePost] = useState<Post | null>(null);

  // My posts filter state
  // My posts filter state
  const [myPostsOnly, setMyPostsOnly] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([]);

  // Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  // Comment state
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const [commentToReport, setCommentToReport] = useState<number | null>(null);
  const [commentReportReason, setCommentReportReason] = useState('');
  const [nicknameToReport, setNicknameToReport] = useState<{
    nickname: string;
    id: string | number;
    isComment: boolean;
  } | null>(null);
  const [nicknameReportReason, setNicknameReportReason] = useState('');

  const submitNicknameReport = async () => {
    if (!nicknameToReport) return;
    try {
      const res = await fetch(`${API_BASE_URL}/visitor/nickname-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-visitor-id': visitorId || '',
        },
        body: JSON.stringify({
          targetNickname: nicknameToReport.nickname,
          reason: nicknameReportReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        alert('닉네임 신고가 접수되었습니다.');
      } else {
        const data = await res.json();
        alert(`신고 실패: ${data.message}`);
      }
    } catch (e) {
      console.error(e);
      alert('신고 중 오류가 발생했습니다.');
    } finally {
      setNicknameToReport(null);
      setNicknameReportReason('');
    }
  };

  const fetchPosts = async (
    cat = category,
    s = sort,
    r = rankFilter,
    rd = roundFilter,
    q = activeSearchQuery,
    t = activeSearchTarget,
  ) => {
    setLoading(true);
    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const params = new URLSearchParams({ category: cat, sort: s });
      if (cat === 'WINNING') {
        if (r) params.append('rank', r);
        if (rd) params.append('round', rd);
      }
      if (q) {
        params.append('query', q);
        params.append('target', t);
      }

      const res = await fetch(
        `${API_BASE_URL}/user/board?${params.toString()}`,
        {
          headers: {
            ...(vid ? { 'x-visitor-id': vid } : {}),
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setPosts(data.data || []);
      }
    } catch (e) {
      console.error(e);
      showAlert('error', '게시글 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPostDetail = async (id: number) => {
    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(`${API_BASE_URL}/user/board/${id}`, {
        headers: {
          ...(vid ? { 'x-visitor-id': vid } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActivePost(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts(
      category,
      sort,
      rankFilter,
      roundFilter,
      activeSearchQuery,
      activeSearchTarget,
    );
  }, [
    category,
    sort,
    rankFilter,
    roundFilter,
    activeSearchQuery,
    activeSearchTarget,
  ]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const vid = visitorId || localStorage.getItem('visitor_id') || '';
    const res = await fetch(`${API_BASE_URL}/user/board/presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(vid ? { 'x-visitor-id': vid } : {}),
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    });

    if (!res.ok) throw new Error('업로드 URL 발급에 실패했습니다.');
    const { data } = await res.json();

    const uploadRes = await fetch(data.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(
        'S3 이미지 업로드에 실패했습니다. (CORS 또는 권한 오류를 확인하세요)',
      );
    }

    return data.imageUrl;
  };

  const handleWinningImageSelect = async (file: File) => {
    setLottoAnalyzing(true);
    setLottoRank(null);
    setLottoRound(null);
    setLottoIdentifier(null);
    setLottoError(null);
    setWinningImageUrl('');
    const objectUrl = URL.createObjectURL(file);
    setPreviewImageUrl(objectUrl);
    try {
      const uploadedUrl = await handleImageUpload(file);
      setWinningImageUrl(uploadedUrl);

      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(`${API_BASE_URL}/user/board/analyze-lotto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(vid ? { 'x-visitor-id': vid } : {}),
        },
        body: JSON.stringify({ imageUrl: uploadedUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setLottoRank(data.data.rank);
        if (data.data.episode) setLottoRound(parseInt(data.data.episode, 10));
        if (data.data.lottoIdentifier)
          setLottoIdentifier(data.data.lottoIdentifier);
        setWinningImageUrl(`${uploadedUrl}?t=${Date.now()}`); // Bypass cache to show blurred image
      } else {
        const errData = await res.json();
        setLottoError(errData.message || '당첨 판독에 실패했습니다.');
        setPreviewImageUrl('');
      }
    } catch (e) {
      setLottoError((e as Error).message || '오류가 발생했습니다.');
      setPreviewImageUrl('');
    } finally {
      setLottoAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showAlert('error', '제목과 내용을 입력해주세요.');
      return;
    }

    if (category === 'WINNING' && !winningImageUrl) {
      showAlert('error', '당첨 인증 사진이 필수입니다.');
      return;
    }
    if (category === 'WINNING' && lottoRank === 6) {
      showAlert('error', '낙첨된 로또는 인증 게시글을 등록할 수 없습니다.');
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl: string | undefined = undefined;
      if (category === 'WINNING') {
        imageUrl = winningImageUrl;
      } else if (imageFiles.length > 0) {
        imageUrl = await handleImageUpload(imageFiles[0]);
      }

      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(`${API_BASE_URL}/user/board`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(vid ? { 'x-visitor-id': vid } : {}),
        },
        body: JSON.stringify({
          category,
          title,
          content,
          imageUrl,
          lottoRank: category === 'WINNING' ? lottoRank : undefined,
          lottoRound: category === 'WINNING' ? lottoRound : undefined,
          lottoIdentifier: category === 'WINNING' ? lottoIdentifier : undefined,
        }),
      });

      if (res.ok) {
        showAlert('success', '글이 성공적으로 등록되었습니다.');
        setTitle('');
        setContent('');
        setImageFiles([]);
        setWinningImageUrl('');
        setLottoRank(null);
        setLottoRound(null);
        setLottoIdentifier(null);
        setLottoError(null);
        setPreviewImageUrl('');
        setIsWriting(false);
        fetchPosts();
      } else {
        const data = await res.json();
        throw new Error(data.message || '글 등록에 실패했습니다.');
      }
    } catch (e) {
      showAlert('error', (e as Error).message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !reportReason.trim()) return;

    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(
        `${API_BASE_URL}/user/board/${activePost.id}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(vid ? { 'x-visitor-id': vid } : {}),
          },
          body: JSON.stringify({ reason: reportReason }),
        },
      );

      if (res.ok) {
        showAlert('success', '신고가 접수되었습니다.');
        setReportReason('');
        setShowReportModal(false);
      } else {
        const data = await res.json();
        showAlert('error', data.message || '신고에 실패했습니다.');
      }
    } catch {
      showAlert('error', '오류가 발생했습니다.');
    }
  };

  const handleDelete = (postId: number) => {
    setConfirmConfig({
      isOpen: true,
      message: '정말 이 게시글을 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          const vid = visitorId || localStorage.getItem('visitor_id') || '';
          const res = await fetch(`${API_BASE_URL}/user/board/${postId}`, {
            method: 'DELETE',
            headers: {
              ...(vid ? { 'x-visitor-id': vid } : {}),
            },
          });

          if (res.ok) {
            showAlert('success', '삭제되었습니다.');
            setActivePost(null);
            fetchPosts();
          } else {
            showAlert('error', '삭제 권한이 없거나 실패했습니다.');
          }
        } catch {
          showAlert('error', '오류가 발생했습니다.');
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const handlePostLike = async () => {
    if (!activePost) return;
    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(
        `${API_BASE_URL}/user/board/${activePost.id}/like`,
        {
          method: 'POST',
          headers: { ...(vid ? { 'x-visitor-id': vid } : {}) },
        },
      );
      if (res.ok) {
        fetchPostDetail(activePost.id);
        fetchPosts(category, sort, rankFilter);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !commentContent.trim()) return;
    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(
        `${API_BASE_URL}/user/board/${activePost.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(vid ? { 'x-visitor-id': vid } : {}),
          },
          body: JSON.stringify({ content: commentContent }),
        },
      );
      if (res.ok) {
        setCommentContent('');
        fetchPostDetail(activePost.id);
        fetchPosts(category, sort, rankFilter);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!activePost || !replyContent.trim()) return;
    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(
        `${API_BASE_URL}/user/board/${activePost.id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(vid ? { 'x-visitor-id': vid } : {}),
          },
          body: JSON.stringify({ content: replyContent, parentId }),
        },
      );
      if (res.ok) {
        setReplyContent('');
        setReplyingTo(null);
        fetchPostDetail(activePost.id);
        fetchPosts(category, sort, rankFilter);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentDelete = (commentId: number) => {
    if (!activePost) return;
    setConfirmConfig({
      isOpen: true,
      message: '댓글을 삭제하시겠습니까?',
      onConfirm: async () => {
        try {
          const vid = visitorId || localStorage.getItem('visitor_id') || '';
          const res = await fetch(
            `${API_BASE_URL}/user/board/${activePost.id}/comments/${commentId}`,
            {
              method: 'DELETE',
              headers: { ...(vid ? { 'x-visitor-id': vid } : {}) },
            },
          );
          if (res.ok) {
            showAlert('success', '댓글이 삭제되었습니다.');
            fetchPostDetail(activePost.id);
            fetchPosts(category, sort, rankFilter);
          }
        } catch {
          showAlert('error', '오류가 발생했습니다.');
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const handleCommentLike = async (commentId: number) => {
    if (!activePost) return;
    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(
        `${API_BASE_URL}/user/board/${activePost.id}/comments/${commentId}/like`,
        {
          method: 'POST',
          headers: { ...(vid ? { 'x-visitor-id': vid } : {}) },
        },
      );
      if (res.ok) {
        fetchPostDetail(activePost.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommentReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePost || !commentToReport || !commentReportReason.trim()) return;
    try {
      const vid = visitorId || localStorage.getItem('visitor_id') || '';
      const res = await fetch(
        `${API_BASE_URL}/user/board/${activePost.id}/comments/${commentToReport}/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(vid ? { 'x-visitor-id': vid } : {}),
          },
          body: JSON.stringify({ reason: commentReportReason }),
        },
      );
      if (res.ok) {
        showAlert('success', '댓글 신고가 접수되었습니다.');
        setCommentToReport(null);
        setCommentReportReason('');
      } else {
        showAlert('error', '신고에 실패했습니다.');
      }
    } catch {
      showAlert('error', '오류가 발생했습니다.');
    }
  };

  const handleBulkDelete = () => {
    if (selectedPostIds.length === 0) return;
    setConfirmConfig({
      isOpen: true,
      message: `선택하신 ${selectedPostIds.length}개의 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      onConfirm: async () => {
        try {
          const vid = visitorId || localStorage.getItem('visitor_id') || '';
          const res = await fetch(`${API_BASE_URL}/user/board/bulk`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              ...(vid ? { 'x-visitor-id': vid } : {}),
            },
            body: JSON.stringify({ postIds: selectedPostIds }),
          });

          if (res.ok) {
            showAlert('success', '선택한 글이 삭제되었습니다.');
            setSelectedPostIds([]);
            fetchPosts();
          } else {
            showAlert('error', '삭제 권한이 없거나 실패했습니다.');
          }
        } catch {
          showAlert('error', '오류가 발생했습니다.');
        } finally {
          setConfirmConfig(null);
        }
      },
    });
  };

  const filteredPosts = myPostsOnly
    ? posts.filter((p) => p.visitorId === visitorId)
    : posts;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        margin: 0,
        padding: 0,
      }}
    >
      <div>
        <h3
          className="section-title"
          style={{ color: 'var(--primary-cyan)', marginBottom: '8px' }}
        >
          게시판
        </h3>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {(['FREE', 'KNOWHOW', 'WINNING'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setIsWriting(false);
                  setActivePost(null);
                  setWinningImageUrl('');
                  setLottoRank(null);
                  setLottoRound(null);
                  setLottoIdentifier(null);
                  setLottoError(null);
                  setPreviewImageUrl('');
                  setImageFiles([]);
                  setTitle('');
                  setContent('');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background:
                    category === cat
                      ? 'var(--primary-cyan)'
                      : 'rgba(255,255,255,0.05)',
                  color: category === cat ? '#0f111a' : 'var(--text-main)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {cat === 'FREE'
                  ? '자유'
                  : cat === 'KNOWHOW'
                    ? '노하우'
                    : '당첨 인증'}
              </button>
            ))}

            {!isWriting && !activePost && (
              <button
                onClick={() => {
                  setMyPostsOnly(!myPostsOnly);
                  setSelectedPostIds([]);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  background: myPostsOnly
                    ? 'rgba(0, 240, 255, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: myPostsOnly
                    ? '1px solid var(--primary-cyan)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  color: myPostsOnly
                    ? 'var(--primary-cyan)'
                    : 'var(--text-dim)',
                  padding: '4px 8px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  marginLeft: '6px',
                  userSelect: 'none',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                내가 쓴 글
              </button>
            )}

            {myPostsOnly && !isWriting && !activePost && (
              <>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.75rem',
                    color: 'var(--text-main)',
                    marginLeft: '8px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    background:
                      filteredPosts.length > 0 &&
                      selectedPostIds.length === filteredPosts.length
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(255,255,255,0.05)',
                    border:
                      filteredPosts.length > 0 &&
                      selectedPostIds.length === filteredPosts.length
                        ? '1px solid var(--primary-cyan)'
                        : '1px solid rgba(255,255,255,0.1)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '4px',
                      border:
                        filteredPosts.length > 0 &&
                        selectedPostIds.length === filteredPosts.length
                          ? 'none'
                          : '1px solid rgba(255,255,255,0.3)',
                      background:
                        filteredPosts.length > 0 &&
                        selectedPostIds.length === filteredPosts.length
                          ? 'var(--primary-cyan)'
                          : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {filteredPosts.length > 0 &&
                      selectedPostIds.length === filteredPosts.length && (
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#000"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                  </div>
                  <input
                    type="checkbox"
                    checked={
                      filteredPosts.length > 0 &&
                      selectedPostIds.length === filteredPosts.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPostIds(filteredPosts.map((p) => p.id));
                      } else {
                        setSelectedPostIds([]);
                      }
                    }}
                    style={{ display: 'none' }}
                  />
                  전체 선택
                </label>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedPostIds.length === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    background:
                      selectedPostIds.length > 0
                        ? 'rgba(255, 60, 60, 0.15)'
                        : 'rgba(255, 255, 255, 0.04)',
                    border:
                      selectedPostIds.length > 0
                        ? '1px solid rgba(255, 60, 60, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    color:
                      selectedPostIds.length > 0
                        ? '#ff4d4d'
                        : 'var(--text-dim)',
                    padding: '4px 8px',
                    borderRadius: '16px',
                    cursor:
                      selectedPostIds.length > 0 ? 'pointer' : 'not-allowed',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    marginLeft: '6px',
                    userSelect: 'none',
                    opacity: selectedPostIds.length > 0 ? 1 : 0.5,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: '4px' }}
                  >
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  선택 삭제 ({selectedPostIds.length})
                </button>
              </>
            )}
          </div>

          {!isWriting && !activePost && (
            <button
              onClick={() => {
                setIsWriting(true);
                setTitle('');
                setContent('');
                setImageFiles([]);
                setWinningImageUrl('');
                setLottoRank(null);
                setLottoRound(null);
                setLottoIdentifier(null);
                setLottoError(null);
                setPreviewImageUrl('');
              }}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                background:
                  'linear-gradient(135deg, var(--primary-cyan) 0%, var(--primary-purple) 100%)',
                color: '#0f111a',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              글쓰기
            </button>
          )}
        </div>

        {!isWriting && !activePost && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '12px',
              paddingBottom: '4px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setSort('latest')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color:
                    sort === 'latest'
                      ? 'var(--primary-cyan)'
                      : 'var(--text-dim)',
                  fontWeight: sort === 'latest' ? 'bold' : 'normal',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                최신순
              </button>
              <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
              <button
                onClick={() => setSort('likes')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color:
                    sort === 'likes'
                      ? 'var(--primary-cyan)'
                      : 'var(--text-dim)',
                  fontWeight: sort === 'likes' ? 'bold' : 'normal',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                좋아요순
              </button>
            </div>

            {category === 'WINNING' && (
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <input
                  type="number"
                  placeholder="회차 검색"
                  className="input-glow no-spin"
                  value={roundFilter}
                  onChange={(e) => setRoundFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-main)',
                    width: '100px',
                  }}
                />
                <select
                  className="input-glow"
                  value={rankFilter}
                  onChange={(e) => setRankFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-main)',
                    width: '90px',
                  }}
                >
                  <option value="">등수 전체</option>
                  <option value="1">1등</option>
                  <option value="2">2등</option>
                  <option value="3">3등</option>
                  <option value="4">4등</option>
                  <option value="5">5등</option>
                </select>
              </div>
            )}
          </div>
        )}

        {!isWriting && !activePost && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setActiveSearchQuery(searchQuery);
              setActiveSearchTarget(searchTarget);
            }}
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '12px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <select
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
                style={{
                  height: '100%',
                  padding: '8px 32px 8px 12px',
                  fontSize: '0.9rem',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--primary-cyan)',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  fontWeight: 'bold',
                }}
              >
                <option
                  value="all"
                  style={{ background: '#0f111a', color: '#fff' }}
                >
                  전체
                </option>
                <option
                  value="title"
                  style={{ background: '#0f111a', color: '#fff' }}
                >
                  제목
                </option>
                <option
                  value="content"
                  style={{ background: '#0f111a', color: '#fff' }}
                >
                  내용
                </option>
                <option
                  value="author"
                  style={{ background: '#0f111a', color: '#fff' }}
                >
                  작성자
                </option>
              </select>
              <div
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--primary-cyan)',
                  fontSize: '0.6rem',
                }}
              >
                ▼
              </div>
            </div>
            <input
              type="text"
              placeholder={
                searchTarget === 'all'
                  ? '검색어를 입력하세요 (제목, 내용, 작성자)'
                  : `${searchTarget === 'title' ? '제목' : searchTarget === 'content' ? '내용' : '작성자'} 검색`
              }
              className="input-glow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: '0.9rem',
                borderRadius: '6px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-main)',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--primary-cyan)',
                color: '#0f111a',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'var(--primary-cyan-hover)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'var(--primary-cyan)')
              }
            >
              검색
            </button>
          </form>
        )}
      </div>

      {isWriting ? (
        <div
          style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <h4
            style={{
              margin: '0 0 16px 0',
              color: 'var(--text-main)',
              textAlign: 'left',
            }}
          >
            새 글 작성
          </h4>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                textAlign: 'left',
              }}
            >
              {!(category === 'WINNING' && winningImageUrl) && (
                <label
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-dim)',
                    fontWeight: '600',
                  }}
                >
                  {category === 'WINNING'
                    ? '인증 사진 첨부 (한 번 첨부 후 수정 불가)'
                    : '파일 첨부'}{' '}
                  {category === 'WINNING' && (
                    <span style={{ color: '#ff4b4b' }}>(필수)</span>
                  )}
                </label>
              )}

              <div
                style={{
                  border:
                    category === 'WINNING' && winningImageUrl
                      ? 'none'
                      : '2px dashed rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding:
                    category === 'WINNING' && winningImageUrl ? '0' : '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  background:
                    category === 'WINNING' && winningImageUrl
                      ? 'transparent'
                      : 'rgba(255,255,255,0.01)',
                  minHeight:
                    category === 'WINNING' && winningImageUrl
                      ? 'auto'
                      : '100px',
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) {
                    const files = Array.from(e.dataTransfer.files);
                    const allowedExtensions =
                      /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i;

                    if (category === 'WINNING') {
                      const file = files[0];
                      if (!file.type.startsWith('image/')) {
                        showAlert(
                          'error',
                          '당첨 인증 게시판에는 이미지 형식의 파일만 업로드할 수 있습니다.',
                        );
                        return;
                      }
                      handleWinningImageSelect(file);
                    } else {
                      const invalid = files.some(
                        (f) => !allowedExtensions.test(f.name),
                      );
                      if (invalid) {
                        showAlert(
                          'error',
                          '허용되지 않는 파일 형식입니다. (이미지, PDF, 오피스 문서 및 텍스트 파일만 업로드 가능)',
                        );
                        return;
                      }
                      setImageFiles((prev) => [...prev, ...files]);
                    }
                  }
                }}
              >
                <input
                  type="file"
                  multiple
                  accept={
                    category === 'WINNING'
                      ? 'image/png, image/jpeg, image/jpg, image/gif, image/webp'
                      : '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
                  }
                  onChange={(e) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files);
                      const allowedExtensions =
                        /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i;

                      if (category === 'WINNING') {
                        const file = files[0];
                        if (!file.type.startsWith('image/')) {
                          showAlert(
                            'error',
                            '당첨 인증 게시판에는 이미지 형식의 파일만 업로드할 수 있습니다.',
                          );
                          e.target.value = '';
                          return;
                        }
                        handleWinningImageSelect(file);
                      } else {
                        const invalid = files.some(
                          (f) => !allowedExtensions.test(f.name),
                        );
                        if (invalid) {
                          showAlert(
                            'error',
                            '허용되지 않는 파일 형식입니다. (이미지, PDF, 오피스 문서 및 텍스트 파일만 업로드 가능)',
                          );
                          e.target.value = '';
                          return;
                        }
                        setImageFiles((prev) => [...prev, ...files]);
                      }
                    }
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    display:
                      category === 'WINNING' && winningImageUrl
                        ? 'none'
                        : 'block',
                  }}
                />

                {lottoAnalyzing ? (
                  <div
                    style={{
                      padding: '30px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <style>{`
                      @keyframes scanline {
                        0% { top: 0%; opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                      }
                    `}</style>
                    {previewImageUrl && (
                      <div
                        style={{
                          position: 'relative',
                          width: '100%',
                          maxWidth: '150px',
                          marginBottom: '20px',
                        }}
                      >
                        <img
                          src={previewImageUrl}
                          alt="scanning preview"
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            opacity: 0.6,
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'var(--primary-cyan)',
                            boxShadow: '0 0 12px var(--primary-cyan)',
                            animation: 'scanline 1.5s linear infinite',
                          }}
                        />
                      </div>
                    )}
                    {!previewImageUrl && (
                      <div
                        style={{
                          margin: '0 auto 16px',
                          width: '36px',
                          height: '36px',
                          border: '3px solid rgba(0,240,255,0.2)',
                          borderTopColor: 'var(--primary-cyan)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      ></div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--primary-cyan)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          filter: 'drop-shadow(0 0 4px var(--primary-cyan))',
                        }}
                      >
                        <path d="M4 7V4h3" />
                        <path d="M17 4h3v3" />
                        <path d="M20 17v3h-3" />
                        <path d="M7 20H4v-3" />
                        <rect x="7" y="7" width="10" height="10" rx="2" />
                        <line
                          x1="2"
                          y1="12"
                          x2="22"
                          y2="12"
                          style={{ animation: 'scanline 1.5s linear infinite' }}
                        />
                      </svg>
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          color: 'var(--primary-cyan)',
                          letterSpacing: '0.5px',
                        }}
                      >
                        AI가 로또 이미지를 스캔하고 있습니다
                      </span>
                    </div>
                    <span
                      style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}
                    >
                      안전한 인증을 위해 당첨 번호와 식별자를 분석 중입니다...
                    </span>
                  </div>
                ) : category === 'WINNING' && winningImageUrl ? (
                  <div
                    style={{
                      textAlign: 'center',
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto',
                      display: 'block',
                      width: '100%',
                    }}
                  >
                    <img
                      src={winningImageUrl}
                      alt="Uploaded"
                      style={{
                        maxHeight: '150px',
                        borderRadius: '8px',
                        marginBottom: '12px',
                      }}
                    />
                  </div>
                ) : imageFiles.length > 0 && category !== 'WINNING' ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      position: 'relative',
                      zIndex: 10,
                      pointerEvents: 'auto',
                    }}
                  >
                    {imageFiles.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--primary-cyan)',
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '80%',
                          }}
                        >
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setImageFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            );
                          }}
                          style={{
                            background: 'rgba(255,75,75,0.2)',
                            border: 'none',
                            color: '#ff4b4b',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      display: 'block',
                      width: '100%',
                      marginTop:
                        category === 'WINNING' && winningImageUrl
                          ? '16px'
                          : '0',
                    }}
                  >
                    {category === 'WINNING' && winningImageUrl ? (
                      <div
                        style={{
                          padding: '20px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        <h3
                          style={{
                            margin: '0 0 8px 0',
                            color: 'var(--primary-cyan)',
                          }}
                        >
                          {lottoRank === 1
                            ? '🏆'
                            : lottoRank === 2
                              ? '🥈'
                              : lottoRank === 3
                                ? '🥉'
                                : '🎊'}{' '}
                          {lottoRank}등 당첨! 축하합니다!
                        </h3>
                        {lottoRound && (
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.9rem',
                              color: 'var(--text-dim)',
                            }}
                          >
                            제 {lottoRound}회차
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '1.2rem',
                            marginBottom: '4px',
                          }}
                        >
                          📤
                        </span>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-dim)',
                          }}
                        >
                          클릭하거나 파일을 여기로 드래그하여 업로드하세요
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {category === 'WINNING' && (
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                {lottoError ? (
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: 'rgba(255,165,0,0.1)',
                      border: '1px solid orange',
                      borderRadius: '8px',
                      color: 'orange',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        marginRight: '6px',
                        verticalAlign: 'middle',
                        marginTop: '-2px',
                      }}
                    >
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    {lottoError}
                  </div>
                ) : lottoRank !== null ? (
                  lottoRank <= 5 ? (
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: 'rgba(0,240,255,0.1)',
                        border: '1px solid var(--primary-cyan)',
                        borderRadius: '20px',
                        color: 'var(--primary-cyan)',
                        fontWeight: 'bold',
                      }}
                    >
                      {lottoRank === 1 ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            marginRight: '4px',
                            verticalAlign: 'middle',
                            marginTop: '-2px',
                          }}
                        >
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                          <path d="M4 22h16"></path>
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path>
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            marginRight: '4px',
                            verticalAlign: 'middle',
                            marginTop: '-2px',
                          }}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      )}
                      {lottoRank}등 당첨! 축하합니다!
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: 'rgba(255,75,75,0.1)',
                        border: '1px solid #ff4b4b',
                        borderRadius: '20px',
                        color: '#ff4b4b',
                        fontWeight: 'bold',
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          marginRight: '4px',
                          verticalAlign: 'middle',
                          marginTop: '-2px',
                        }}
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                      </svg>
                      아쉽게도 낙첨입니다.
                    </div>
                  )
                ) : null}
              </div>
            )}

            {!(
              category === 'WINNING' &&
              (lottoRank === null || lottoRank > 5 || lottoError)
            ) && (
              <>
                <input
                  type="text"
                  className="input-glow"
                  placeholder="제목을 입력하세요 (최대 100자)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  style={{ height: '36px', textAlign: 'left' }}
                />
                <textarea
                  className="input-glow"
                  placeholder={
                    category === 'WINNING'
                      ? '당첨 소감을 입력해주세요.'
                      : '내용을 작성해주세요.'
                  }
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  style={{
                    minHeight: '150px',
                    padding: '10px',
                    textAlign: 'left',
                  }}
                />
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsWriting(false);
                  setTitle('');
                  setContent('');
                  setImageFiles([]);
                  setWinningImageUrl('');
                  setLottoRank(null);
                  setLottoRound(null);
                  setLottoIdentifier(null);
                  setLottoError(null);
                  setPreviewImageUrl('');
                }}
                style={{
                  flex: 1,
                  height: '36px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-main)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={
                  submitting ||
                  (category === 'WINNING' &&
                    (lottoRank === null ||
                      lottoRank > 5 ||
                      lottoError !== null))
                }
                style={{
                  flex: 1,
                  height: '36px',
                  background:
                    category === 'WINNING' &&
                    (lottoRank === null || lottoRank > 5 || lottoError !== null)
                      ? 'rgba(255,255,255,0.1)'
                      : 'var(--primary-cyan)',
                  border: 'none',
                  color:
                    category === 'WINNING' &&
                    (lottoRank === null || lottoRank > 5 || lottoError !== null)
                      ? 'var(--text-dim)'
                      : '#0f111a',
                  fontWeight: 'bold',
                  borderRadius: '6px',
                  cursor:
                    category === 'WINNING' &&
                    (lottoRank === null || lottoRank > 5 || lottoError !== null)
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {submitting ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </div>
      ) : activePost ? (
        <div
          style={{
            padding: '20px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <h4
                style={{
                  margin: '0 0 4px 0',
                  color: 'var(--text-main)',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {activePost.category === 'WINNING' &&
                  activePost.lottoRank &&
                  activePost.lottoRank <= 5 && (
                    <span
                      className={`badge badge-rank-${activePost.lottoRank}`}
                    >
                      {activePost.lottoRound
                        ? `${activePost.lottoRound}회 `
                        : ''}
                      {activePost.lottoRank}등 당첨
                    </span>
                  )}
                {activePost.title}
              </h4>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const name = activePost.visitor?.nickname;
                    if (name) {
                      setNicknameToReport({
                        nickname: name,
                        id: activePost.id,
                        isComment: false,
                      });
                    }
                  }}
                >
                  {activePost.visitor?.nickname ||
                    activePost.visitorId.substring(0, 8)}
                </span>
                <span>|</span>
                <span>
                  {new Date(activePost.createdAt).toLocaleDateString()}
                </span>
                <span>|</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--primary-cyan)',
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill={activePost.isLiked ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  {activePost._count?.likes || 0}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActivePost(null)}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-dim)',
                padding: '4px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              목록으로
            </button>
          </div>

          {activePost.imageUrl && (
            <div
              style={{
                marginBottom: '16px',
                borderRadius: '8px',
                overflow: 'hidden',
                textAlign: 'left',
              }}
            >
              {/\.(jpg|jpeg|png|gif|webp|svg)/i.test(activePost.imageUrl) ? (
                <img
                  src={activePost.imageUrl}
                  alt="Attachment"
                  style={{ maxWidth: '100%', maxHeight: '350px' }}
                />
              ) : (
                <a
                  href={activePost.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attachment-card"
                >
                  <svg className="attachment-icon-svg" viewBox="0 0 24 24">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                  </svg>
                  <span className="attachment-text">첨부파일 다운로드</span>
                </a>
              )}
            </div>
          )}

          <p
            style={{
              color: 'var(--text-muted)',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6',
              fontSize: '0.9rem',
              textAlign: 'left',
            }}
          >
            {activePost.content}
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '16px',
              marginTop: '24px',
            }}
          >
            <button
              onClick={() => setShowReportModal(true)}
              style={{
                padding: '6px 12px',
                background: 'rgba(255,75,75,0.1)',
                border: '1px solid rgba(255,75,75,0.2)',
                color: '#ff4b4b',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              🚨 신고하기
            </button>
            <button
              onClick={handlePostLike}
              style={{
                padding: '6px 12px',
                background: activePost.isLiked
                  ? 'rgba(0,240,255,0.1)'
                  : 'rgba(255,255,255,0.05)',
                border: activePost.isLiked
                  ? '1px solid rgba(0,240,255,0.3)'
                  : '1px solid rgba(255,255,255,0.1)',
                color: activePost.isLiked
                  ? 'var(--primary-cyan)'
                  : 'var(--text-dim)',
                borderRadius: '4px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill={activePost.isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              좋아요
            </button>
            {(activePost.visitorId === visitorId ||
              localStorage.getItem('mk')) && (
              <button
                onClick={() => handleDelete(activePost.id)}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-dim)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                삭제
              </button>
            )}
          </div>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <h5
              style={{
                margin: '0 0 16px 0',
                color: 'var(--text-main)',
                fontSize: '1rem',
              }}
            >
              댓글{' '}
              <span style={{ color: 'var(--primary-cyan)' }}>
                {activePost._count?.comments || 0}
              </span>
            </h5>

            <form
              onSubmit={handleCommentSubmit}
              style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}
            >
              <input
                type="text"
                className="input-glow"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="댓글을 남겨보세요..."
                style={{ flex: 1, padding: '10px' }}
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!commentContent.trim()}
                style={{
                  padding: '0 20px',
                  background: commentContent.trim()
                    ? 'var(--primary-cyan)'
                    : 'rgba(255,255,255,0.1)',
                  color: commentContent.trim() ? '#0f111a' : 'var(--text-dim)',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: commentContent.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                등록
              </button>
            </form>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {activePost.comments?.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                        }}
                      >
                        <span
                          style={{
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const name = comment.visitor?.nickname;
                            if (name) {
                              setNicknameToReport({
                                nickname: name,
                                id: comment.id,
                                isComment: true,
                              });
                            }
                          }}
                        >
                          {comment.visitor?.nickname ||
                            comment.visitorId.substring(0, 8)}
                        </span>
                      </span>
                      <span
                        style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}
                      >
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        onClick={() => handleCommentLike(comment.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: comment.isLiked
                            ? 'var(--primary-cyan)'
                            : 'var(--text-dim)',
                          fontSize: '0.75rem',
                        }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill={comment.isLiked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        {comment._count?.likes || 0}
                      </button>
                      <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                      <button
                        onClick={() => {
                          setCommentToReport(comment.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff4b4b',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        신고
                      </button>
                      {(comment.visitorId === visitorId ||
                        localStorage.getItem('mk')) && (
                        <>
                          <span style={{ color: 'rgba(255,255,255,0.1)' }}>
                            |
                          </span>
                          <button
                            onClick={() => handleCommentDelete(comment.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-dim)',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.9rem',
                      color: 'var(--text-main)',
                      lineHeight: '1.4',
                    }}
                  >
                    {comment.content}
                  </p>

                  <div style={{ marginTop: '8px' }}>
                    <button
                      onClick={() =>
                        setReplyingTo(
                          replyingTo === comment.id ? null : comment.id,
                        )
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary-cyan)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {replyingTo === comment.id ? '취소' : '답글 달기'}
                    </button>
                  </div>
                  {replyingTo === comment.id && (
                    <form
                      onSubmit={(e) => handleReplySubmit(e, comment.id)}
                      style={{ display: 'flex', gap: '8px', marginTop: '8px' }}
                    >
                      <input
                        type="text"
                        className="input-glow"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="답글을 입력하세요..."
                        style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                        maxLength={200}
                      />
                      <button
                        type="submit"
                        disabled={!replyContent.trim()}
                        style={{
                          padding: '0 16px',
                          background: replyContent.trim()
                            ? 'var(--primary-cyan)'
                            : 'rgba(255,255,255,0.1)',
                          color: replyContent.trim()
                            ? '#0f111a'
                            : 'var(--text-dim)',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          cursor: replyContent.trim()
                            ? 'pointer'
                            : 'not-allowed',
                          fontSize: '0.85rem',
                        }}
                      >
                        등록
                      </button>
                    </form>
                  )}
                  {comment.replies && comment.replies.length > 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingLeft: '16px',
                        borderLeft: '2px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          style={{
                            padding: '8px',
                            background: 'rgba(255,255,255,0.01)',
                            borderRadius: '6px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '4px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 'bold',
                                  fontSize: '0.8rem',
                                  color: 'var(--text-main)',
                                }}
                              >
                                <span
                                  style={{
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const name = reply.visitor?.nickname;
                                    if (name)
                                      setNicknameToReport({
                                        nickname: name,
                                        id: reply.id,
                                        isComment: true,
                                      });
                                  }}
                                >
                                  {reply.visitor?.nickname ||
                                    reply.visitorId.substring(0, 8)}
                                </span>
                              </span>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  color: 'var(--text-dim)',
                                }}
                              >
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                gap: '8px',
                                alignItems: 'center',
                              }}
                            >
                              {(reply.visitorId === visitorId ||
                                localStorage.getItem('mk')) && (
                                <button
                                  onClick={() => handleCommentDelete(reply.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-dim)',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.85rem',
                              color: 'var(--text-main)',
                            }}
                          >
                            {reply.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '8px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
              불러오는 중...
            </p>
          ) : filteredPosts.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--text-dim)',
                padding: '20px 0',
              }}
            >
              게시글이 존재하지 않습니다.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {myPostsOnly && (
                    <label
                      style={{
                        marginRight: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '6px',
                          border: selectedPostIds.includes(post.id)
                            ? 'none'
                            : '1px solid rgba(255,255,255,0.3)',
                          background: selectedPostIds.includes(post.id)
                            ? 'var(--primary-cyan)'
                            : 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {selectedPostIds.includes(post.id) && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#000"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedPostIds.includes(post.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPostIds((prev) => [...prev, post.id]);
                          } else {
                            setSelectedPostIds((prev) =>
                              prev.filter((id) => id !== post.id),
                            );
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                  <div
                    onClick={() => fetchPostDetail(post.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flex: 1,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: 'var(--text-main)',
                          fontSize: '0.9rem',
                          fontWeight: '500',
                          textAlign: 'left',
                        }}
                      >
                        {post.category === 'WINNING' &&
                          post.lottoRank &&
                          post.lottoRank <= 5 && (
                            <span
                              className={`badge badge-rank-${post.lottoRank}`}
                              style={{
                                padding: '2px 6px',
                                fontSize: '0.7rem',
                                marginRight: '4px',
                              }}
                            >
                              {post.lottoRound ? `${post.lottoRound}회 ` : ''}
                              {post.lottoRank}등
                            </span>
                          )}
                        {post.title}
                        {post.imageUrl && (
                          <span className="list-attachment-icon">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="3"
                                y="3"
                                width="18"
                                height="18"
                                rx="2"
                                ry="2"
                              ></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                          </span>
                        )}
                      </span>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--text-dim)',
                          marginTop: '4px',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <span>
                          {post.visitor?.nickname ||
                            post.visitorId.substring(0, 8)}
                        </span>
                        <span>|</span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            marginLeft: 'auto',
                            color: 'var(--primary-cyan)',
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                          {post._count?.likes || 0}
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            color: 'var(--text-main)',
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          {post._count?.comments || 0}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-dim)',
                        paddingLeft: '12px',
                      }}
                    >
                      ➔
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,75,75,0.3)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              animation: 'zoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: '#ff4b4b' }}>
              게시글 신고
            </h4>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                marginBottom: '16px',
              }}
            >
              신고 사유를 구체적으로 적어주세요. 허위 신고 시 조치가 취해질 수
              있습니다.
            </p>
            <form
              onSubmit={handleReport}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <textarea
                className="input-glow"
                placeholder="신고 사유를 작성해주세요."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                style={{ minHeight: '100px', padding: '10px' }}
                required
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  style={{
                    flex: 1,
                    height: '36px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-dim)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    height: '36px',
                    background: '#ff4b4b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  신고 접수
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {commentToReport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              background: 'var(--bg-card)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,75,75,0.3)',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              animation: 'zoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: '#ff4b4b' }}>
              댓글 신고
            </h4>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-dim)',
                marginBottom: '16px',
              }}
            >
              신고 사유를 구체적으로 적어주세요. 허위 신고 시 조치가 취해질 수
              있습니다.
            </p>
            <form
              onSubmit={handleCommentReportSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <textarea
                className="input-glow"
                placeholder="신고 사유를 작성해주세요."
                value={commentReportReason}
                onChange={(e) => setCommentReportReason(e.target.value)}
                style={{ minHeight: '100px', padding: '10px' }}
                required
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCommentToReport(null);
                    setCommentReportReason('');
                  }}
                  style={{
                    flex: 1,
                    height: '36px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-dim)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    height: '36px',
                    background: '#ff4b4b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  신고 접수
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmDialog
          isOpen={confirmConfig.isOpen}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
        />
      )}

      {nicknameToReport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setNicknameToReport(null)}
        >
          <div
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '1.25rem',
                fontWeight: 600,
              }}
            >
              닉네임 신고하기
            </h3>
            <p
              style={{
                margin: '0 0 16px 0',
                fontSize: '0.85rem',
                color: 'var(--text-dim)',
              }}
            >
              신고 대상:{' '}
              <strong style={{ color: '#fff' }}>
                {nicknameToReport.nickname}
              </strong>
            </p>
            <textarea
              placeholder="불건전 닉네임 신고 사유를 입력해주세요. (선택사항)"
              value={nicknameReportReason}
              onChange={(e) => setNicknameReportReason(e.target.value)}
              style={{
                width: '100%',
                height: '80px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px',
                color: '#fff',
                marginBottom: '16px',
                resize: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', cursor: 'pointer' }}
                onClick={() => setNicknameToReport(null)}
              >
                취소
              </button>
              <button
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#ef5350',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={submitNicknameReport}
              >
                신고하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Board;
