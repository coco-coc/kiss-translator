import { persistSubtitlePosition } from "./subtitle.js";
import { getSetting, setSetting } from "../libs/storage.js";
import { logger } from "../libs/log.js";

jest.mock("../libs/storage.js", () => ({
  getSetting: jest.fn(),
  setSetting: jest.fn(),
}));

jest.mock("../libs/log.js", () => ({
  LogLevel: {
    INFO: { value: "info" },
  },
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("../injectors/index.js", () => ({
  injectJs: jest.fn(),
  INJECTOR: { subtitle: "subtitle" },
}));

jest.mock("./YouTubeCaptionProvider.js", () => ({
  YouTubeInitializer: jest.fn(),
}));

describe("persistSubtitlePosition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("merges the ratio without replacing unrelated settings", async () => {
    getSetting.mockResolvedValue({
      darkMode: "dark",
      subtitleSetting: {
        apiSlug: "microsoft",
        rememberPosition: true,
      },
    });

    await persistSubtitlePosition(0.3);

    expect(setSetting).toHaveBeenCalledWith({
      darkMode: "dark",
      subtitleSetting: {
        apiSlug: "microsoft",
        rememberPosition: true,
        positionRatio: 0.3,
      },
    });
  });

  test("does not break subtitle rendering when storage fails", async () => {
    getSetting.mockRejectedValue(new Error("storage unavailable"));

    await expect(persistSubtitlePosition(0.3)).resolves.toBeUndefined();
    expect(setSetting).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  test("keeps complete subtitle defaults when storage is initially empty", async () => {
    getSetting.mockResolvedValue(null);

    await persistSubtitlePosition(0.3);

    expect(setSetting).toHaveBeenCalledWith(
      expect.objectContaining({
        subtitleSetting: expect.objectContaining({
          enabled: true,
          positionRatio: 0.3,
        }),
      })
    );
  });
});
