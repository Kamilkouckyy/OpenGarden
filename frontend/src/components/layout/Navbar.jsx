import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../../i18n/LanguageContext";
import "./Navbar.css";

export default function Navbar({ user, navItems = [], onLogin, onLogout }) {
  const { t } = useLanguage();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleNavClick = () => setIsMenuOpen(false);

  return (
    <nav className="og-navbar" aria-label={t("nav.ariaLabel")}>
      <div className="og-brand">
        <span className="og-brand-text">OpenGarden</span>
      </div>

      <button
        className={`og-hamburger${isMenuOpen ? " open" : ""}`}
        aria-label={t("nav.toggleMenu")}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((prev) => !prev)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`og-main-nav${isMenuOpen ? " open" : ""}`}>
        <ul className="og-links">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `og-link${isActive ? " active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="og-user" ref={userMenuRef}>
          {user ? (
            <>
              <button
                type="button"
                className="og-user-trigger"
                aria-expanded={isUserMenuOpen}
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
              >
                <span>
                  {t("nav.loggedInAs")}: {user.name} ({user.role})
                </span>
                <span className="og-caret" aria-hidden="true">
                  {isUserMenuOpen ? "▲" : "▼"}
                </span>
              </button>
              {isUserMenuOpen && (
                <div className="og-user-menu" role="menu">
                  <button
                    type="button"
                    className="og-user-menu-item"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsMenuOpen(false);
                      onLogout?.();
                    }}
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              type="button"
              className="og-login-btn"
              onClick={() => {
                setIsMenuOpen(false);
                onLogin?.();
              }}
            >
              {t("nav.login")}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}