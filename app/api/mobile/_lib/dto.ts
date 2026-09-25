export function userDto(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  phone: string;
  role: string;
  avatar: string | null;
  region: string | null;
  bio: string | null;
  verified: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    age: user.age,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    region: user.region,
    bio: user.bio,
    verified: user.verified,
    createdAt: user.createdAt.toISOString(),
  };
}

export function authorDto(author: {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  verified: boolean;
}) {
  return {
    id: author.id,
    name: `${author.firstName} ${author.lastName}`.trim(),
    avatar: author.avatar,
    verified: author.verified,
  };
}

export function absoluteMediaUrl(origin: string, value: string | null | undefined) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, origin).toString();
}

export function postDto(origin: string, post: {
  id: string;
  title: string;
  content: string;
  ethnicGroupId: string | null;
  images: string[];
  tags: string[];
  likes: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; firstName: string; lastName: string; avatar: string | null; verified: boolean };
  _count?: { comments: number };
}, liked = false) {
  const author = authorDto(post.author);
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    ethnicGroupId: post.ethnicGroupId,
    media: post.images.map(value => absoluteMediaUrl(origin, value)),
    tags: post.tags,
    likes: post.likes,
    liked,
    status: post.status,
    commentsCount: post._count?.comments || 0,
    author: { ...author, avatar: absoluteMediaUrl(origin, author.avatar) },
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function commentDto(origin: string, comment: {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; firstName: string; lastName: string; avatar: string | null; verified: boolean };
}) {
  const author = authorDto(comment.author);
  return {
    id: comment.id,
    content: comment.content,
    authorId: comment.authorId,
    postId: comment.postId,
    author: { ...author, avatar: absoluteMediaUrl(origin, author.avatar) },
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}
