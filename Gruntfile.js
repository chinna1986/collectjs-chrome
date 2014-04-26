module.exports = function(grunt){
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                browser: true,
                validthis: true,
                globalstrict: true,
                globals: {
                    chrome: true,
                    SelectorFamily: true,
                    tabs: true
                },
                devel: true,
                expr: true
            },
            all: ['collect/collect.js']
        },
        sass: {
            dist: {
                files: {
                    'collect/css/interface.css': 'src/css/interface.scss'
                }
            }
        },
        html_to_js_str: {
            test: {
                files: {
                  'collect/collect.js': 'src/collect.js'
                }
            }
        },
        jasmine: {
            pivotal: {
                src: 'collect/collect.js',
                options: {
                    specs: 'tests/CollectSpec.js',
                    helpers: 'tests/CollectHelper.js'
                }
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-html-to-js-str');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    
    grunt.registerTask('default', ['sass', 'html_to_js_str', 'jshint']);

    grunt.registerTask('test', ['html_to_js_str', 'jasmine']);
}
