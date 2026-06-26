# React 19.2 Code Examples

## Using the `use()` Hook (React 19)

```typescript
import { use, Suspense } from "react";

interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(id: number): Promise<User> {
  const res = await fetch(`https://api.example.com/users/${id}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  // use() hook suspends rendering until promise resolves
  const user = use(userPromise);

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

export function UserProfilePage({ userId }: { userId: number }) {
  const userPromise = fetchUser(userId);

  return (
    <Suspense fallback={<div>Loading user...</div>}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

## Form with Actions and useFormStatus (React 19)

```typescript
import { useFormStatus } from "react-dom";
import { useActionState } from "react";

// Submit button that shows pending state
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit"}
    </button>
  );
}

interface FormState {
  error?: string;
  success?: boolean;
}

// Server Action or async action
async function createPost(prevState: FormState, formData: FormData): Promise<FormState> {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    return { error: "Title and content are required" };
  }

  try {
    const res = await fetch("https://api.example.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (!res.ok) throw new Error("Failed to create post");

    return { success: true };
  } catch (error) {
    return { error: "Failed to create post" };
  }
}

export function CreatePostForm() {
  const [state, formAction] = useActionState(createPost, {});

  return (
    <form action={formAction}>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Content" required />

      {state.error && <p className="error">{state.error}</p>}
      {state.success && <p className="success">Post created!</p>}

      <SubmitButton />
    </form>
  );
}
```

## Optimistic Updates with useOptimistic (React 19)

```typescript
import { useState, useOptimistic, useTransition } from "react";

interface Message {
  id: string;
  text: string;
  sending?: boolean;
}

async function sendMessage(text: string): Promise<Message> {
  const res = await fetch("https://api.example.com/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export function MessageList({ initialMessages }: { initialMessages: Message[] }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(messages, (state, newMessage: Message) => [...state, newMessage]);
  const [isPending, startTransition] = useTransition();

  const handleSend = async (text: string) => {
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      text,
      sending: true,
    };

    // Optimistically add message to UI
    addOptimisticMessage(tempMessage);

    startTransition(async () => {
      const savedMessage = await sendMessage(text);
      setMessages((prev) => [...prev, savedMessage]);
    });
  };

  return (
    <div>
      {optimisticMessages.map((msg) => (
        <div key={msg.id} className={msg.sending ? "opacity-50" : ""}>
          {msg.text}
        </div>
      ))}
      <MessageInput onSend={handleSend} disabled={isPending} />
    </div>
  );
}
```

## Using useEffectEvent (React 19.2)

```typescript
import { useState, useEffect, useEffectEvent } from "react";

interface ChatProps {
  roomId: string;
  theme: "light" | "dark";
}

export function ChatRoom({ roomId, theme }: ChatProps) {
  const [messages, setMessages] = useState<string[]>([]);

  // useEffectEvent extracts non-reactive logic from effects
  // theme changes won't cause reconnection
  const onMessage = useEffectEvent((message: string) => {
    // Can access latest theme without making effect depend on it
    console.log(`Received message in ${theme} theme:`, message);
    setMessages((prev) => [...prev, message]);
  });

  useEffect(() => {
    // Only reconnect when roomId changes, not when theme changes
    const connection = createConnection(roomId);
    connection.on("message", onMessage);
    connection.connect();

    return () => {
      connection.disconnect();
    };
  }, [roomId]); // theme not in dependencies!

  return (
    <div className={theme}>
      {messages.map((msg, i) => (
        <div key={i}>{msg}</div>
      ))}
    </div>
  );
}
```

## Using <Activity> Component (React 19.2)

```typescript
import { Activity, useState } from "react";

export function TabPanel() {
  const [activeTab, setActiveTab] = useState<"home" | "profile" | "settings">("home");

  return (
    <div>
      <nav>
        <button onClick={() => setActiveTab("home")}>Home</button>
        <button onClick={() => setActiveTab("profile")}>Profile</button>
        <button onClick={() => setActiveTab("settings")}>Settings</button>
      </nav>

      {/* Activity preserves UI and state when hidden */}
      <Activity mode={activeTab === "home" ? "visible" : "hidden"}>
        <HomeTab />
      </Activity>

      <Activity mode={activeTab === "profile" ? "visible" : "hidden"}>
        <ProfileTab />
      </Activity>

      <Activity mode={activeTab === "settings" ? "visible" : "hidden"}>
        <SettingsTab />
      </Activity>
    </div>
  );
}

function HomeTab() {
  // State is preserved when tab is hidden and restored when visible
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

## Custom Hook with TypeScript Generics

```typescript
import { useState, useEffect } from "react";

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);

        const json = await response.json();

        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [url, refetchCounter]);

  const refetch = () => setRefetchCounter((prev) => prev + 1);

  return { data, loading, error, refetch };
}

// Usage with type inference
function UserList() {
  const { data, loading, error } = useFetch<User[]>("https://api.example.com/users");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Error Boundary with TypeScript

```typescript
import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div role="alert">
            <h2>Something went wrong</h2>
            <details>
              <summary>Error details</summary>
              <pre>{this.state.error?.message}</pre>
            </details>
            <button onClick={() => this.setState({ hasError: false, error: null })}>Try again</button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

## Using cacheSignal for Resource Cleanup (React 19.2)

```typescript
import { cache, cacheSignal } from "react";

// Cache with automatic cleanup when cache expires
const fetchUserData = cache(async (userId: string) => {
  const controller = new AbortController();
  const signal = cacheSignal();

  // Listen for cache expiration to abort the fetch
  signal.addEventListener("abort", () => {
    console.log(`Cache expired for user ${userId}`);
    controller.abort();
  });

  try {
    const response = await fetch(`https://api.example.com/users/${userId}`, {
      signal: controller.signal,
    });

    if (!response.ok) throw new Error("Failed to fetch user");
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Fetch aborted due to cache expiration");
    }
    throw error;
  }
});

// Usage in component
function UserProfile({ userId }: { userId: string }) {
  const user = use(fetchUserData(userId));

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
```

## Ref as Prop - No More forwardRef (React 19)

```typescript
// React 19: ref is now a regular prop!
interface InputProps {
  placeholder?: string;
  ref?: React.Ref<HTMLInputElement>; // ref is just a prop now
}

// No need for forwardRef anymore
function CustomInput({ placeholder, ref }: InputProps) {
  return <input ref={ref} placeholder={placeholder} className="custom-input" />;
}

// Usage
function ParentComponent() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <CustomInput ref={inputRef} placeholder="Enter text" />
      <button onClick={focusInput}>Focus Input</button>
    </div>
  );
}
```

## Context Without Provider (React 19)

```typescript
import { createContext, useContext, useState } from "react";

interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// React 19: Render context directly instead of Context.Provider
function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const value = { theme, toggleTheme };

  // Old way: <ThemeContext.Provider value={value}>
  // New way in React 19: Render context directly
  return (
    <ThemeContext value={value}>
      <Header />
      <Main />
      <Footer />
    </ThemeContext>
  );
}

// Usage remains the same
function Header() {
  const { theme, toggleTheme } = useContext(ThemeContext)!;

  return (
    <header className={theme}>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </header>
  );
}
```

## Ref Callback with Cleanup Function (React 19)

```typescript
import { useState } from "react";

function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  // React 19: Ref callbacks can now return cleanup functions!
  const videoRef = (element: HTMLVideoElement | null) => {
    if (element) {
      console.log("Video element mounted");

      // Set up observers, listeners, etc.
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.play();
          } else {
            element.pause();
          }
        });
      });

      observer.observe(element);

      // Return cleanup function - called when element is removed
      return () => {
        console.log("Video element unmounting - cleaning up");
        observer.disconnect();
        element.pause();
      };
    }
  };

  return (
    <div>
      <video ref={videoRef} src="/video.mp4" controls />
      <button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? "Pause" : "Play"}</button>
    </div>
  );
}
```

## Document Metadata in Components (React 19)

```typescript
// React 19: Place metadata directly in components
// React will automatically hoist these to <head>
function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      {/* These will be hoisted to <head> */}
      <title>{post.title} - My Blog</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />
      <meta property="og:description" content={post.excerpt} />
      <link rel="canonical" href={`https://myblog.com/posts/${post.slug}`} />

      {/* Regular content */}
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

## useDeferredValue with Initial Value (React 19)

```typescript
import { useState, useDeferredValue, useTransition } from "react";

interface SearchResultsProps {
  query: string;
}

function SearchResults({ query }: SearchResultsProps) {
  // React 19: useDeferredValue now supports initial value
  // Shows "Loading..." initially while first deferred value loads
  const deferredQuery = useDeferredValue(query, "Loading...");

  const results = useSearchResults(deferredQuery);

  return (
    <div>
      <h3>Results for: {deferredQuery}</h3>
      {deferredQuery === "Loading..." ? (
        <p>Preparing search...</p>
      ) : (
        <ul>
          {results.map((result) => (
            <li key={result.id}>{result.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchApp() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSearch = (value: string) => {
    startTransition(() => {
      setQuery(value);
    });
  };

  return (
    <div>
      <input type="search" onChange={(e) => handleSearch(e.target.value)} placeholder="Search..." />
      {isPending && <span>Searching...</span>}
      <SearchResults query={query} />
    </div>
  );
}
```
