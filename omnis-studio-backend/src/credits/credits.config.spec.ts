import { describe, it, expect } from "vitest"
import {
  SIGNUP_BONUS_CREDITS,
  LOW_CREDIT_WARNING_THRESHOLD,
  QUALITY_MULTIPLIERS,
  calculateImageCredits,
  calculateVideoCredits,
  getCreditsConfig,
} from "./credits.config.js"

describe("CreditsConfig", () => {
  it("should export expected constants", () => {
    expect(SIGNUP_BONUS_CREDITS).toBe(5)
    expect(LOW_CREDIT_WARNING_THRESHOLD).toBe(1)
    expect(QUALITY_MULTIPLIERS).toEqual({
      standard: 1,
      high: 1.4,
      ultra: 1.8,
    })
  })

  describe("calculateImageCredits", () => {
    it("should calculate base cost for flux-schnell", () => {
      expect(calculateImageCredits("flux-schnell", "standard")).toBe(0.5)
    })

    it("should apply quality multiplier", () => {
      const base = 0.5
      expect(calculateImageCredits("flux-schnell", "high")).toBeCloseTo(base * 1.4, 2)
      expect(calculateImageCredits("flux-schnell", "ultra")).toBeCloseTo(base * 1.8, 2)
    })

    it("should default to high quality if quality is not provided", () => {
      const cost = calculateImageCredits("flux-schnell")
      expect(cost).toBeCloseTo(0.5 * 1.4, 2)
    })

    it("should fall back to flux-schnell cost for unknown models", () => {
      const cost = calculateImageCredits("unknown-model", "standard")
      expect(cost).toBe(0.5)
    })

    it("should calculate for flux-pro ultra correctly", () => {
      expect(calculateImageCredits("flux-pro", "ultra")).toBeCloseTo(2.5 * 1.8, 2)
    })

    it("should calculate for openai models", () => {
      expect(calculateImageCredits("gpt-image-1", "standard")).toBeCloseTo(1.5, 2)
      expect(calculateImageCredits("gpt-image-2-2026-04-21", "ultra")).toBeCloseTo(2.2 * 1.8, 2)
    })
  })

  describe("calculateVideoCredits", () => {
    it("should calculate for fast-video 5s standard resolution", () => {
      const cost = calculateVideoCredits("fast-video", "5s", "720p")
      expect(cost).toBe(Math.round(1.5 * 5 * 1))
    })

    it("should apply 1080p multiplier", () => {
      const cost = calculateVideoCredits("fast-video", "5s", "1080p")
      expect(cost).toBe(Math.round(1.5 * 5 * 1.5))
    })

    it("should calculate for premium-video", () => {
      const cost = calculateVideoCredits("premium-video", "10s", "1080p")
      expect(cost).toBe(Math.round(3.0 * 10 * 1.5))
    })

    it("should default to fast-video rate for unknown models", () => {
      const cost = calculateVideoCredits("unknown-model", "5s", "720p")
      expect(cost).toBe(Math.round(1.5 * 5 * 1))
    })

    it("should default duration to 5s if parsing fails", () => {
      const cost = calculateVideoCredits("fast-video", "invalid", "720p")
      expect(cost).toBe(Math.round(1.5 * 5 * 1))
    })
  })

  describe("getCreditsConfig", () => {
    it("should return the full config object", () => {
      const config = getCreditsConfig()
      expect(config.signupBonus).toBe(5)
      expect(config.lowCreditThreshold).toBe(1)
      expect(config.qualityMultipliers).toEqual(QUALITY_MULTIPLIERS)
      expect(config.models.flux.length).toBeGreaterThan(0)
      expect(config.models.openai.length).toBeGreaterThan(0)
      expect(config.videoBaseRates).toBeDefined()
    })

    it("should include flux models with base costs", () => {
      const config = getCreditsConfig()
      const fluxSchnell = config.models.flux.find((m) => m.value === "flux-schnell")
      expect(fluxSchnell).toBeDefined()
      expect(fluxSchnell!.baseCost).toBe(0.5)
    })
  })
})
