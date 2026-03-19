import email from "infra/email.js";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.deleteAllEmails();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await email.send({
      from: "Test <test@gmachado.dev.br>",
      to: "contact@gmachado.dev.br",
      subject: "test subject first",
      text: "test body 1.",
    });

    const secondEmail = {
      from: "Test <test@gmachado.dev.br>",
      to: "contact@gmachado.dev.br",
      subject: "test subject second",
      text: "test body 2.",
    };
    await email.send(secondEmail);

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toEqual("<test@gmachado.dev.br>");
    expect(lastEmail.recipients[0]).toEqual("<contact@gmachado.dev.br>");
    expect(lastEmail.subject).toEqual("test subject second");
    expect(lastEmail.text).toEqual("test body 2.\n");
  });
});
