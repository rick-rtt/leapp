import { CliUx } from "@oclif/core";
import { describe, expect, jest, test } from "@jest/globals";
import ListProfiles from './list'

describe("ListProfiles", () => {
  test("run", async () => {
    const command = new ListProfiles([], {} as any) as any;
    command.showProfiles = jest.fn();
    await command.run();

    expect(command.showProfiles).toHaveBeenCalled();
  });

  test("run - showProfiles throw an error", async () => {
    const command = new ListProfiles([], {} as any, {} as any) as any;
    command.showProfiles = jest.fn(async () => {
      throw new Error("error");
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("error"));
    }
  });

  test("run - showProfiles throw an object", async () => {
    const command = new ListProfiles([], {} as any, {} as any) as any;
    command.showProfiles = jest.fn(async () => {
      throw "string";
    });
    try {
      await command.run();
    } catch (error) {
      expect(error).toEqual(new Error("Unknown error: string"));
    }
  });

  test("showProfiles", async () => {
    const profiles = [
      {
        name: 'profileName',
      },
    ];
    const leapCliService = {
      namedProfilesService: {
        getNamedProfiles: () => profiles,
      },
    };

    const command = new ListProfiles([], {} as any, leapCliService as any) as any;
    const tableSpy = jest.spyOn(CliUx.ux, "table").mockImplementation(() => null);

    await command.showProfiles();

    const expectedData = [
      {
        name: "profileName",
      },
    ];

    expect(tableSpy.mock.calls[0][0]).toEqual(expectedData);

    const expectedColumns = {
      name: { header: "Profile Name" },
    };
    expect(tableSpy.mock.calls[0][1]).toEqual(expectedColumns);
  });
});
