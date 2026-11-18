import { type PluginOption } from 'vite';
export declare function createWebOCConfig(mode: string, moduleFederationAdapter: string, additionalPlugins?: PluginOption[]): {
    define: {
        __GIT_HASH__: string;
        __GIT_TAG__: string;
        __BUILD_DATE__: string;
    };
    build: {
        rolldownOptions: {
            input: {
                main: string;
                error: string;
            };
        };
    };
    server: {
        port: number;
        proxy: {
            '/FewsWebServices/': {
                target: string;
                changeOrigin: boolean;
                auth: string | undefined;
            };
        };
        headers: {
            'content-security-policy': string;
        };
    };
    resolve: {
        alias: {
            '@weboc/module-federation': string;
            '@': string;
            'vuetify/labs/VNumberInput': string;
            'vuetify/labs/VTimePicker': string;
            'vuetify/labs/VStepperVertical': string;
        };
    };
    plugins: PluginOption[];
    optimizeDeps: {
        exclude: string[];
    };
    test: {
        include: string[];
        server: {
            deps: {
                inline: string[];
            };
        };
    };
};
