Vue.component('command-help-item', {
    props: ['command','description'],
    template: `
        <tr>
            <td><span class="mono">{{ command }}</span></td>
            <td>{{ description }}</td>
        </tr>
    `
});

Vue.component('help-page', {
    data: {
        commandslist: [
            {
                command: '/help',
                description: 'displays this help page'
            }
        ]
    },
    template: `
    <h3>Help Page</h3>
    This is a list of the supported commands.<br>
    For more info please refer to the project's README. You can find it <a href="#">here</a>

    <h4>Command list</h4>
    <table>
            <command-help-item
            v-for="command in commandslist"
            v-bind:description="command.id"
            v-bind:title="command.title"
          ></command-help-item>
    </table>
    `
});

var app = new Vue({ 
    el: '#app',
    data: {
        message: 'Hello Vue!',
        commandslist: [
            {
                command: '/help',
                description: 'displays this help page'
            }
        ]
    }
});


