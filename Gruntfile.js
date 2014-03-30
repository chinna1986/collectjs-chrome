module.exports = function(grunt){
    
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        sass: {
            dist: {
                files: {
                    'collect/css/interface.css': 'src/css/interface.scss'
                }
            }
        },
        copy: {
            main: {
                src: 'src/collect.js',
                dest: 'collect/collect.js'
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-copy');
    
    grunt.registerTask('default', ['sass', 'copy']);
}
