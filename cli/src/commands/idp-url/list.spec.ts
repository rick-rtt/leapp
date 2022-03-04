import { CliUx } from "@oclif/core";
import { describe, expect, jest, test } from "@jest/globals";
import ListIdpUrls from './list'

describe("ListIdpUrls", () => {
  test("run", async () => {
    const command = new ListIdpUrls([], {} as any) as any;
    command.showIdpUrls= jest.fn();
    await command.run();

    expect(command.showIdpUrls).toHaveBeenCalled();
  });

  test("run - showIdpUrls throw an error", async () => {
    const command = new ListIdpUrls([], {} as any, {} as any) as any;
    command.showIdpUrls = jest.fn(async () => {
      throw new Error("error");
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("error"));
    }
  });

  test("run - showIdpUrls throw an object", async () => {
    const command = new ListIdpUrls([], {} as any, {} as any) as any;
    command.showIdpUrls = jest.fn(async () => {
      throw "string";
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("Unknown error: string"));
    }
  });

  test("showIdpUrls", async () => {
    const idpUrls = [
      {
        url: 'idpUrlsName',
      },
    ];
    const leapCliService = {
      idpUrlsService: {
        getIdpUrls: () => idpUrls,
      },
    };

    const command = new ListIdpUrls([], {} as any, leapCliService as any) as any;
    const tableSpy = jest.spyOn(CliUx.ux, "table").mockImplementation(() => null);

    await command.showIdpUrls();

    const expectedData = [
      {
        url: "idpUrlsName",
      },
    ];

    expect(tableSpy.mock.calls[0][0]).toEqual(expectedData);

    const expectedColumns = {
      url: { header: "Identity Provider URL" },
    };
    expect(tableSpy.mock.calls[0][1]).toEqual(expectedColumns);
  });
});
