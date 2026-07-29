import { describe, expect, it } from "vitest";
import { APP_CONFIG, getCurrentPlan, parseConfigDate } from "@/config/app";
import {
  calendarDaysBetween,
  formatSubscriptionDate,
  getSubscriptionInfo,
  shouldShowExpiryBanner,
} from "./subscription";

describe("APP_CONFIG", () => {
  it("exposes install date from configuration (not component hardcodes)", () => {
    expect(APP_CONFIG.license.installDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getCurrentPlan().name).toBeTruthy();
    expect(getCurrentPlan().durationDays).toBeGreaterThan(0);
  });
});

describe("calendarDaysBetween", () => {
  it("counts whole calendar days", () => {
    expect(
      calendarDaysBetween(new Date(2026, 6, 28), new Date(2026, 6, 29)),
    ).toBe(1);
    expect(
      calendarDaysBetween(new Date(2026, 6, 28), new Date(2026, 7, 27)),
    ).toBe(30);
  });
});

describe("getSubscriptionInfo", () => {
  const install = parseConfigDate(APP_CONFIG.license.installDate);
  const duration = getCurrentPlan().durationDays;

  it("computes remaining days from config install date", () => {
    // Day after install → duration - 1 remaining.
    const dayAfter = new Date(
      install.getFullYear(),
      install.getMonth(),
      install.getDate() + 1,
    );
    const info = getSubscriptionInfo(dayAfter, { installDate: install });
    expect(info.remainingDays).toBe(duration - 1);
    expect(info.planName).toBe(getCurrentPlan().name);
    expect(info.monthlyPrice).toBe(getCurrentPlan().monthlyPrice);
    expect(info.tone).toBe("green");
  });

  it("decrements remaining days each calendar day", () => {
    const d1 = getSubscriptionInfo(
      new Date(install.getFullYear(), install.getMonth(), install.getDate() + 1),
      { installDate: install },
    );
    const d2 = getSubscriptionInfo(
      new Date(install.getFullYear(), install.getMonth(), install.getDate() + 2),
      { installDate: install },
    );
    const d3 = getSubscriptionInfo(
      new Date(install.getFullYear(), install.getMonth(), install.getDate() + 3),
      { installDate: install },
    );
    expect(d1.remainingDays - d2.remainingDays).toBe(1);
    expect(d2.remainingDays - d3.remainingDays).toBe(1);
  });

  it("turns amber at 7 days and red at 3 days", () => {
    const renewalOffset = duration;
    // 7 days before renewal
    const at7 = new Date(
      install.getFullYear(),
      install.getMonth(),
      install.getDate() + renewalOffset - 7,
    );
    expect(getSubscriptionInfo(at7, { installDate: install }).tone).toBe(
      "amber",
    );
    expect(
      getSubscriptionInfo(at7, { installDate: install }).remainingDays,
    ).toBe(7);

    const at3 = new Date(
      install.getFullYear(),
      install.getMonth(),
      install.getDate() + renewalOffset - 3,
    );
    expect(getSubscriptionInfo(at3, { installDate: install }).tone).toBe(
      "red",
    );
    expect(
      getSubscriptionInfo(at3, { installDate: install }).remainingDays,
    ).toBe(3);
  });

  it("rolls into the next billing cycle after renewal", () => {
    const onRenewal = new Date(
      install.getFullYear(),
      install.getMonth(),
      install.getDate() + duration,
    );
    const info = getSubscriptionInfo(onRenewal, { installDate: install });
    expect(info.remainingDays).toBe(duration);
    expect(info.cycleNumber).toBe(2);
  });

  it("formats dates stably", () => {
    expect(formatSubscriptionDate(new Date(2026, 6, 28))).toBe("28 Jul 2026");
  });

  it("shows expiry banner at ≤7 days", () => {
    const at7 = new Date(
      install.getFullYear(),
      install.getMonth(),
      install.getDate() + duration - 7,
    );
    const info = getSubscriptionInfo(at7, { installDate: install });
    expect(shouldShowExpiryBanner(info)).toBe(true);

    const early = new Date(
      install.getFullYear(),
      install.getMonth(),
      install.getDate() + 1,
    );
    expect(
      shouldShowExpiryBanner(
        getSubscriptionInfo(early, { installDate: install }),
      ),
    ).toBe(false);
  });
});
