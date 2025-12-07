"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("로그아웃 오류:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  if (isLoading) {
    return (
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#e5e7eb'
      }}></div>
    );
  }

  if (!user) {
    return (
      <a
        href="/login"
        style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          textDecoration: 'none'
        }}
      >
        로그인
      </a>
    );
  }

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '9999px',
        padding: '4px',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent'
      }}>
        {user.user_metadata?.avatar_url ? (
          <Image
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata?.name || "사용자"}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div style={{
            display: 'flex',
            width: '32px',
            height: '32px',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {user.user_metadata?.name?.[0] || user.email?.[0] || "U"}
          </div>
        )}
        <span style={{
          fontSize: '14px',
          color: '#374151'
        }}>
          {user.user_metadata?.name || user.email}
        </span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '100%',
          paddingTop: '8px',
          width: '192px',
          zIndex: 50,
        }}>
          <div style={{
            borderRadius: '6px',
            backgroundColor: 'white',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '4px 0' }}>
              <a
                href="/my/campaigns"
                style={{
                  display: 'block',
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#374151',
                  textDecoration: 'none'
                }}
              >
                체험단 관리
              </a>
              <a
                href="/settings"
                style={{
                  display: 'block',
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#374151',
                  textDecoration: 'none'
                }}
              >
                설정
              </a>
              <button
                onClick={handleLogout}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: '#374151',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
