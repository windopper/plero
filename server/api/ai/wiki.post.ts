export default defineEventHandler(async (event) => {
    const { instruction } = await readBody(event);

    return {
        success: true,
        data: {
            title: "test",
            content: "test",
        },
    };
});