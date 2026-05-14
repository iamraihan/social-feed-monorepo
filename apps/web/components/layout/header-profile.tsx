"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Popover } from "@/components/ui/popover";
import { logoutAction } from "@/features/auth";
import type { SessionUser } from "@/features/auth";

// Profile area of the header — avatar + name + caret act as a single trigger
// for the profile popover (matches the design's clickable-row behaviour).
// Logout uses a Server Action via <form action={…}> so the browser never
// sees a fetch round-trip — the action clears cookies + redirects server-
// side.
//
// Avatar sized 32px so the visual scale matches the bell/chat icons next to
// it; the design's `_header_nav_profile_image` container was 24px wide which
// constrained an <img> but our initials variant ignores that constraint
// (uses inline width/height to render a true circle).

interface HeaderProfileProps {
  user: SessionUser;
}

export function HeaderProfile({ user }: HeaderProfileProps) {
  const [open, setOpen] = useState(false);
  const displayName = `${user.firstName} ${user.lastName}`;

  const trigger = (
    <button
      type="button"
      className="header-profile-trigger btn-reset"
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
    >
      <span className="header-profile-avatar">
        <Avatar
          src={user.avatarKey}
          alt={displayName}
          name={displayName}
          size={32}
          className="_nav_profile_img"
        />
      </span>
      <span className="header-profile-name">{displayName}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="10"
        height="6"
        fill="none"
        viewBox="0 0 10 6"
        aria-hidden="true"
        className="header-profile-caret"
      >
        <path
          fill="#112032"
          d="M5 5l.354.354L5 5.707l-.354-.353L5 5zm4.354-3.646l-4 4-.708-.708 4-4 .708.708zm-4.708 4l-4-4 .708-.708 4 4-.708.708z"
        />
      </svg>
    </button>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      ariaLabel="Profile menu"
      trigger={trigger}
      className="header-profile-wrapper"
      panelClassName="popover-panel header-profile-panel"
    >
      <div className="header-profile-info">
        <Avatar
          src={user.avatarKey}
          alt={displayName}
          name={displayName}
          size={40}
        />
        <div className="header-profile-info-text">
          <p className="header-profile-info-name">{displayName}</p>
          <Link
            href="#0"
            className="header-profile-info-link"
            onClick={() => setOpen(false)}
          >
            View Profile
          </Link>
        </div>
      </div>
      <hr className="header-profile-divider" />
      <Link
        href="#0"
        role="menuitem"
        className="popover-item"
        onClick={() => setOpen(false)}
      >
        Settings
      </Link>
      <form action={logoutAction}>
        <button
          type="submit"
          role="menuitem"
          className="popover-item popover-item-danger header-profile-logout"
        >
          Log Out
        </button>
      </form>
    </Popover>
  );
}
