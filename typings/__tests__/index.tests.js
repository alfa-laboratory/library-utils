const getTypings = require('../index');

test('simple component with all prop types', async () => {
    const typings = await getTypings(require.resolve('../__examples__/a.jsx'));

    expect(typings).toMatchSnapshot();
});
