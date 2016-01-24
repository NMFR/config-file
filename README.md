# Config File

A configuration object that loads settings from a file.
The settings file contains a JSON object as text/string.

Example of a file that can be loaded:
```json
{
  "log": {
    "debug": true,
    "warn": true
  },
  "port": 8999,
  "defaultAuth": "*"
} 
```

The config object has the ability to listen to changes on the settings file and refresh the settings in case the config file changes.

In case the file change event is triggered the Config will check if the file has really changed by hashing the file contents using SHA1 and comparing it with the previous file hash.

Config is a EventEmitter an can emit the following events:
* change: 

  The settings file has changed and the new settings have been loaded. 
  The event listener will receive the old settings and the new settings has parameters:
  ``` javascript
  function onChangeListener(oldSettings, newSettings) {
    // something
  };
  ```
  
* error:
 
  An error occured while parsing the settings file.
  Example of a listener:
  ``` javascript
  function onErrorListener(error) {
    // something
  };
  ```
					
When a Config is created it receives an option object. The available options are:
* filePath: A string that indicates the settings file path. 
* loadImmediately: A boolean that indicates if the settings file should be read synchronously or asynchronously the first time (if the file should be read before the Config constructor returns or not). 
* watchConfigFile: If the settings file should be watched for changes or not. 
* onChangeHandler: The function to be called when the settings file changes. 
* onErrorHandler: The function to be called when there is an error while parsing the settings file.
* defaultSettings: The object that contains the default settings of the Config. The settings file settings will be added (and will override) the default settings.
  
## License

MIT (http://www.opensource.org/licenses/mit-license.php)
