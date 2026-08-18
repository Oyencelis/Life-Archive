"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signOutAction } from "@/lib/actions/sign-out";
import { useMotionTokens } from "@/lib/theme/motion-context";
import { ChevronIcon, MenuIcon } from "./icons";
import { SearchOverlay } from "./SearchOverlay";

export interface NavGroup {
  label: string;
  links: { href: string; label: string }[];
}

export function NavClient({
  groups,
  userName,
  userEmail,
  avatarUrl,
}: {
  groups: NavGroup[];
  userName: string;
  userEmail: string;
  avatarUrl?: string;
}) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  function isGroupActive(group: NavGroup) {
    return group.links.some(
      (link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
    );
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
        setUserMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenGroup(null);
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const initial = (userName || userEmail || "?").trim().charAt(0).toUpperCase();
  const motionTokens = useMotionTokens();
  const dropdownTransition = { duration: motionTokens.duration * 0.55, ease: motionTokens.ease };
  const panelTransition = { duration: motionTokens.duration * 0.7, ease: motionTokens.ease };

  return (
    <div className="nav-root" ref={rootRef}>
      <nav className="nav-groups">
        {groups.map((group) => (
          <div key={group.label} className="nav-group">
            <button
              type="button"
              className="nav-group-trigger"
              aria-current={isGroupActive(group) ? "true" : undefined}
              aria-expanded={openGroup === group.label}
              onClick={() =>
                setOpenGroup((cur) => (cur === group.label ? null : group.label))
              }
            >
              {group.label}
              <ChevronIcon open={openGroup === group.label} />
            </button>
            <AnimatePresence>
              {openGroup === group.label && (
                <motion.div
                  className="nav-dropdown"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={dropdownTransition}
                >
                  {group.links.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setOpenGroup(null)}>
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      <div className="nav-utility">
        <SearchOverlay />

        <div className="nav-user">
          <button
            type="button"
            className="nav-avatar"
            aria-expanded={userMenuOpen}
            aria-label="Account menu"
            onClick={() => setUserMenuOpen((v) => !v)}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="nav-avatar-img" />
            ) : (
              initial
            )}
          </button>
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                className="nav-dropdown nav-dropdown-right"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={dropdownTransition}
              >
                <p className="nav-user-name">{userName || userEmail}</p>
                <Link href="/me" onClick={() => setUserMenuOpen(false)}>
                  My profile
                </Link>
                <Link href="/settings" onClick={() => setUserMenuOpen(false)}>
                  Settings
                </Link>
                <button
                  type="button"
                  className="nav-signout"
                  onClick={() => signOutAction()}
                >
                  Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          className="nav-mobile-toggle"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          onClick={() => setMobileOpen((v) => !v)}
        >
          <MenuIcon open={mobileOpen} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="nav-mobile-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={panelTransition}
          >
            {groups.map((group) => (
              <div key={group.label} className="nav-mobile-group">
                <p
                  className="nav-mobile-group-label"
                  aria-current={isGroupActive(group) ? "true" : undefined}
                >
                  {group.label}
                </p>
                {group.links.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
