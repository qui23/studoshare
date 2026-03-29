'use client';
import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: string;
  author: string;
  initials: string;
  color: string;
  role: string;
  content: string;
  createdAt: string;
  upvotes: number;
  upvoted: boolean;
  authorId: string;
  replies: ReplyComment[];
}

interface ReplyComment {
  id: string;
  author: string;
  initials: string;
  color: string;
  content: string;
  createdAt: string;
  upvotes: number;
  upvoted: boolean;
  authorId: string;
}

interface CommentSectionProps {
  documentId?: string;
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
  'bg-teal-100 text-teal-700',
  'bg-cyan-100 text-cyan-700',
  'bg-green-100 text-green-700',
  'bg-blue-100 text-blue-700',
  'bg-orange-100 text-orange-700',
];

function getColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function CommentSection({ documentId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'top'>('top');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    loadComments();
  }, [documentId]);

  const loadComments = async () => {
    if (!documentId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          upvotes,
          created_at,
          author_id,
          parent_id,
          user_profiles!comments_author_id_fkey(full_name, role)
        `)
        .eq('document_id', documentId)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Comments load error:', error.message);
        setLoading(false);
        return;
      }

      const { data: repliesData } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          upvotes,
          created_at,
          author_id,
          parent_id,
          user_profiles!comments_author_id_fkey(full_name, role)
        `)
        .eq('document_id', documentId)
        .not('parent_id', 'is', null)
        .order('created_at', { ascending: true });

      let userUpvotedIds: string[] = [];
      if (user) {
        const { data: upvotesData } = await supabase
          .from('comment_upvotes')
          .select('comment_id')
          .eq('user_id', user.id);
        userUpvotedIds = upvotesData?.map(u => u.comment_id) || [];
      }

      const mapComment = (c: any): Comment => {
        const profile = c.user_profiles as any;
        const authorName = profile?.full_name || 'Anonymous';
        const replies = (repliesData || [])
          .filter((r: any) => r.parent_id === c.id)
          .map((r: any) => {
            const rProfile = r.user_profiles as any;
            const rName = rProfile?.full_name || 'Anonymous';
            return {
              id: r.id,
              author: rName,
              initials: getInitials(rName),
              color: getColor(r.author_id),
              content: r.content,
              createdAt: formatDate(r.created_at),
              upvotes: r.upvotes || 0,
              upvoted: userUpvotedIds.includes(r.id),
              authorId: r.author_id,
            };
          });

        return {
          id: c.id,
          author: authorName,
          initials: getInitials(authorName),
          color: getColor(c.author_id),
          role: profile?.role || 'Student',
          content: c.content,
          createdAt: formatDate(c.created_at),
          upvotes: c.upvotes || 0,
          upvoted: userUpvotedIds.includes(c.id),
          authorId: c.author_id,
          replies,
        };
      };

      setComments((commentsData || []).map(mapComment));
    } catch (err) {
      console.log('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      toast.error('Please sign in to post a comment.');
      return;
    }
    setSubmitting(true);
    try {
      const insertData: any = {
        content: newComment.trim(),
        author_id: user.id,
        parent_id: null,
      };
      if (documentId) {
        insertData.document_id = documentId;
      }

      const { data, error } = await supabase
        .from('comments')
        .insert(insertData)
        .select(`
          id,
          content,
          upvotes,
          created_at,
          author_id,
          parent_id,
          user_profiles!comments_author_id_fkey(full_name, role)
        `)
        .single();

      if (error) {
        toast.error(error.message || 'Failed to post comment.');
        return;
      }

      const profile = (data as any).user_profiles as any;
      const authorName = profile?.full_name || user.email?.split('@')[0] || 'You';
      const newCmt: Comment = {
        id: data.id,
        author: authorName,
        initials: getInitials(authorName),
        color: getColor(data.author_id),
        role: profile?.role || 'Student',
        content: data.content,
        createdAt: 'Just now',
        upvotes: 0,
        upvoted: false,
        authorId: data.author_id,
        replies: [],
      };
      setComments(prev => [newCmt, ...prev]);
      setNewComment('');
      toast.success('Comment posted!');
    } catch (err: any) {
      toast.error('Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id: string) => {
    if (!user) {
      toast.error('Please sign in to upvote.');
      return;
    }
    const comment = comments.find(c => c.id === id);
    if (!comment) return;

    if (comment.upvoted) {
      await supabase.from('comment_upvotes').delete().eq('comment_id', id).eq('user_id', user.id);
      await supabase.from('comments').update({ upvotes: Math.max(0, comment.upvotes - 1) }).eq('id', id);
      setComments(prev => prev.map(c =>
        c.id === id ? { ...c, upvotes: Math.max(0, c.upvotes - 1), upvoted: false } : c
      ));
    } else {
      await supabase.from('comment_upvotes').insert({ comment_id: id, user_id: user.id });
      await supabase.from('comments').update({ upvotes: comment.upvotes + 1 }).eq('id', id);
      setComments(prev => prev.map(c =>
        c.id === id ? { ...c, upvotes: c.upvotes + 1, upvoted: true } : c
      ));
    }
  };

  const handleEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const handleSaveEdit = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('comments')
      .update({ content: editContent })
      .eq('id', id)
      .eq('author_id', user.id);

    if (error) {
      toast.error('Failed to update comment.');
      return;
    }
    setComments(prev => prev.map(c => c.id === id ? { ...c, content: editContent } : c));
    setEditingId(null);
    toast.success('Comment updated');
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
      .eq('author_id', user.id);

    if (error) {
      toast.error('Failed to delete comment.');
      return;
    }
    setComments(prev => prev.filter(c => c.id !== id));
    setDeleteConfirm(null);
    toast.success('Comment deleted');
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    if (!user) {
      toast.error('Please sign in to reply.');
      return;
    }
    try {
      const insertData: any = {
        content: replyContent.trim(),
        author_id: user.id,
        parent_id: parentId,
      };
      if (documentId) {
        insertData.document_id = documentId;
      }

      const { data, error } = await supabase
        .from('comments')
        .insert(insertData)
        .select(`
          id,
          content,
          upvotes,
          created_at,
          author_id,
          parent_id,
          user_profiles!comments_author_id_fkey(full_name, role)
        `)
        .single();

      if (error) {
        toast.error(error.message || 'Failed to post reply.');
        return;
      }

      const profile = (data as any).user_profiles as any;
      const authorName = profile?.full_name || user.email?.split('@')[0] || 'You';
      const newReply: ReplyComment = {
        id: data.id,
        author: authorName,
        initials: getInitials(authorName),
        color: getColor(data.author_id),
        content: data.content,
        createdAt: 'Just now',
        upvotes: 0,
        upvoted: false,
        authorId: data.author_id,
      };
      setComments(prev => prev.map(c =>
        c.id === parentId ? { ...c, replies: [...c.replies, newReply] } : c
      ));
      setReplyingTo(null);
      setReplyContent('');
      toast.success('Reply posted!');
    } catch (err) {
      toast.error('Failed to post reply.');
    }
  };

  const sorted = [...comments].sort((a, b) =>
    sortBy === 'top' ? b.upvotes - a.upvotes : 0
  );

  const currentUserInitials = user
    ? getInitials(user.user_metadata?.full_name || user.email?.split('@')[0] || 'U')
    : 'U';
  const currentUserColor = user ? getColor(user.id) : 'bg-blue-100 text-blue-700';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon name="ChatBubbleLeftRightIcon" size={16} className="text-indigo-600" />
          <span className="font-display font-600 text-gray-900">
            Comments <span className="text-gray-400 font-400 tabular-nums">({comments.length})</span>
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['top', 'newest'] as const).map((s) => (
            <button
              key={`sort-${s}`}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
                sortBy === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'top' ? 'Top' : 'Newest'}
            </button>
          ))}
        </div>
      </div>

      {/* New Comment Form */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-600 text-xs flex-shrink-0 mt-0.5 ${currentUserColor}`}>
            {currentUserInitials}
          </div>
          <form onSubmit={handleSubmit} className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={user ? "Share your thoughts, ask a question, or point out something helpful..." : "Sign in to post a comment..."}
              rows={3}
              disabled={!user}
              className="w-full px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all duration-150 disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">Be respectful and constructive</p>
              <button
                type="submit"
                disabled={submitting || !newComment.trim() || !user}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-display font-600 rounded-lg transition-all duration-150"
              >
                {submitting ? (
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Icon name="PaperAirplaneIcon" size={12} />
                )}
                Post Comment
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="px-5 py-8 text-center">
          <svg className="animate-spin w-6 h-6 text-indigo-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-400">Loading comments...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && sorted.length === 0 && (
        <div className="px-5 py-8 text-center">
          <Icon name="ChatBubbleLeftRightIcon" size={28} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500 font-medium">No comments yet</p>
          <p className="text-xs text-gray-400 mt-1">Be the first to share your thoughts!</p>
        </div>
      )}

      {/* Comments List */}
      {!loading && (
        <div className="divide-y divide-gray-50">
          {sorted.map((comment) => (
            <div key={comment.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-600 text-xs flex-shrink-0 ${comment.color}`}>
                  {comment.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-display font-600 text-sm text-gray-900">{comment.author}</span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md capitalize">{comment.role}</span>
                    <span className="text-xs text-gray-400">{comment.createdAt}</span>
                  </div>

                  {editingId === comment.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 text-sm text-gray-800 border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                      />
                      <div className="flex gap-2 mt-1.5">
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handleUpvote(comment.id)}
                      className={`flex items-center gap-1 text-xs font-medium transition-all duration-150 ${
                        comment.upvoted ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'
                      }`}
                    >
                      <Icon name="HandThumbUpIcon" size={13} />
                      <span className="tabular-nums">{comment.upvotes}</span>
                    </button>
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 font-medium transition-colors"
                    >
                      <Icon name="ChatBubbleLeftIcon" size={13} />
                      Reply
                    </button>
                    {user && comment.authorId === user.id && (
                      <>
                        <button
                          onClick={() => handleEdit(comment.id, comment.content)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-600 font-medium transition-colors"
                        >
                          <Icon name="PencilIcon" size={12} />
                          Edit
                        </button>
                        {deleteConfirm === comment.id ? (
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className="text-red-600 font-medium">Delete?</span>
                            <button onClick={() => handleDelete(comment.id)} className="text-red-500 hover:text-red-700 font-medium">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="text-gray-400 hover:text-gray-600">No</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(comment.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 font-medium transition-colors"
                          >
                            <Icon name="TrashIcon" size={12} />
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display font-600 text-xs flex-shrink-0 mt-0.5 ${currentUserColor}`}>
                        {currentUserInitials}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Reply to ${comment.author}...`}
                          rows={2}
                          className="w-full px-3 py-2 text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all duration-150"
                        />
                        <div className="flex gap-2 mt-1.5">
                          <button
                            onClick={() => handleReply(comment.id)}
                            disabled={!replyContent.trim()}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-all duration-150"
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => setReplyingTo(null)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-indigo-100 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-display font-600 text-xs flex-shrink-0 ${reply.color}`}>
                            {reply.initials}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-display font-600 text-xs text-gray-900">{reply.author}</span>
                              <span className="text-xs text-gray-400">{reply.createdAt}</span>
                            </div>
                            <p className="text-xs text-gray-700 leading-relaxed">{reply.content}</p>
                            <button
                              className={`flex items-center gap-1 text-xs font-medium mt-1 transition-colors ${reply.upvoted ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600'}`}
                            >
                              <Icon name="HandThumbUpIcon" size={11} />
                              <span className="tabular-nums">{reply.upvotes}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}