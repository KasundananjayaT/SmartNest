import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import * as Progress from "react-native-progress";
import ToggleSwitch from "toggle-switch-react-native";
import { getDatafromF1 } from "../API/api";
import { ArrowPathIcon } from "react-native-heroicons/outline";

const getTime = () => {
  const currentTime = new Date();
  const time = [];

  for (let i = 0; i < 7; i++) {
    const previousTime = new Date(currentTime.getTime() - i * 60000);
    const formattedHour = previousTime.getHours();
    const formattedMinute =
      previousTime.getMinutes() < 10
        ? "0" + previousTime.getMinutes()
        : previousTime.getMinutes();
    const formattedTime = `${formattedHour}:${formattedMinute}`;

    time.push(formattedTime);
  }

  return time.reverse(); // Reverse the array to get the times in descending order
};

export default function HomeScreen() {
  const [timelables, setTimelables] = useState(getTime());
  const [dataArray, setDataArray] = useState([10, 12, 13, 14, 15, 16, 17, 18]);
  const rData = dataArray;
  const [humidity, setHumidity] = useState(20);
  const [temperature, setTemperature] = useState(70);
  const [f1Status, setF1] = useState(false);
  const [f2Status, setF2] = useState(false);
  const [f1speed, setf1speed] = useState(0);
  const [f2speed, setf2speed] = useState(0);

  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      // Move only the data points based on gesture.dx
      const dataPointWidth = 400 / (rData.length - 1);
      const numberOfDataPoints = rData.length;
      const maxTranslationX = dataPointWidth * (numberOfDataPoints - 1);

      Animated.event([null, { dx: pan }], {
        useNativeDriver: false,
        listener: (_, { dx }) => {
          if (dx <= 0) {
            pan.setValue(0);
          } else if (dx >= maxTranslationX) {
            pan.setValue(maxTranslationX);
          } else {
            pan.setValue(dx);
          }
        },
      })(_, gesture);
    },
  });
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      apiCall();
    }, 60000); // 60000 milliseconds = 1 minute

    // Clear the interval when the component unmounts or is no longer needed
    return () => clearInterval(refreshInterval);
  }, []);

  const apiCall = async () => {
    try {
      const response = await getDatafromF1();
      const data = response.data;
      console.log(data.feeds);
      setHumidity(data.feeds[0].field2);
      setTemperature(data.feeds[0].field1);
      if (data.feeds[0].field4 === "0") {
        setf1speed(0);
        setF1(false);
      } else {
        setf1speed(255);
        setF1(true);
      }
      if (data.feeds[0].field5 === "0") {
        setf2speed(0);
        setF2(false);
      } else {
        setf2speed(255);
        setF2(true);
      }

      const LPGas = [];
      const newTimeLabels = getTime();

      for (var i = 6; i >= 0; i--) {
        LPGas.push(data.feeds[i].field3);
      }

      setDataArray(LPGas);
      setTimelables(newTimeLabels);

      console.log(LPGas);
    } catch (error) {
      console.error("Error in API call:", error.message);
    }
  };

  return (
    <View className="flex-1 bg-neutral-300">
      <SafeAreaView className="mt-2 flex flex-row items-center justify-between">
        <Text className="p-8 text-2xl font-bold">Smart Nest</Text>
        <TouchableOpacity onPress={apiCall}>
          <View className="pr-8">
            <ArrowPathIcon />
          </View>
        </TouchableOpacity>
      </SafeAreaView>
      <SafeAreaView className="flex flex-row justify-center mt-6">
        <View className="pr-10 flex flex-col justify-center items-center">
          <Text className="mb-4">Humidity</Text>
          <View>
            <Progress.Circle
              size={100}
              indeterminate={false}
              progress={humidity / 100}
              useNativeDriver={true}
              showsText={true}
              borderWidth={1}
            />
          </View>
        </View>
        <View className="pl-10 flex flex-col justify-center items-center">
          <Text className="mb-4">Temperature °C</Text>
          <View>
            <Progress.Circle
              size={100}
              indeterminate={false}
              progress={temperature / 100}
              useNativeDriver={true}
              showsText={true}
              borderWidth={1}
            />
          </View>
        </View>
      </SafeAreaView>
      <SafeAreaView className="mt-10">
        <View className="flex flex-col justify-center items-center">
          <Text className="text-xl font-bold">LP Gas Level</Text>
          <View className="pt-4">
            <LineChart
              data={{
                labels: timelables,
                datasets: [
                  {
                    data: rData,
                  },
                ],
              }}
              width={400} // from react-native
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              yAxisInterval={1} // optional, defaults to 1
              chartConfig={{
                backgroundColor: "#e26a00",
                backgroundGradientFrom: "#fb8c00",
                backgroundGradientTo: "#ffa726",
                decimalPlaces: 2, // optional, defaults to 2dp
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#ffa726",
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </View>
        </View>
      </SafeAreaView>
      <SafeAreaView>
        <View className="flex flex-col justify-center items-center mt-3">
          <Text className="text-xl font-bold">Fan Status</Text>
          <View className="mt-3">
            <View className="flex flex-row gap-x-2">
              <View className="bg-white w-44 p-4 rounded-lg">
                <Text className="font-bold">Exhastive Fan 1</Text>
                <View className="flex flex-row justify-between mt-10">
                  <Text className="font-thin">Speed | {f1speed}</Text>
                  <ToggleSwitch
                    isOn={f1Status}
                    onColor="green"
                    offColor="red"
                    labelStyle={{ color: "black", fontWeight: "400" }}
                    size="small"
                    disabled={true}
                  />
                </View>
              </View>
              <View className="bg-white w-44 p-4 rounded-lg">
                <Text className="font-bold">Exhastive Fan 2</Text>
                <View className="flex flex-row justify-between mt-10">
                  <Text className="font-thin">Speed | {f2speed}</Text>
                  <ToggleSwitch
                    isOn={f2Status}
                    onColor="green"
                    offColor="red"
                    labelStyle={{ color: "black", fontWeight: "400" }}
                    size="small"
                    disabled={true}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
