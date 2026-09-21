import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ONBOARDING_KEY = 'damodar_prayas_onboarding_completed_v1';
const { width } = Dimensions.get('window');
const C = { maroon:'#A80D25', gold:'#D3A12C', paper:'#FFF9EE', ink:'#2F2020', muted:'#6F625C' };
const ICON = require('../../assets/images/icon.png');
const GURU = require('../../assets/images/home-guru-banner.png');
const MATRIMONY = require('../../assets/images/home-matrimony-banner.png');

const slides = [
 { title:'दामोदर प्रयास', sub:'रिश्तों से समाज तक', body:'Darzi Samaj Community & Matrimony\nएक विश्वसनीय और समर्पित प्लेटफॉर्म', image:GURU, kind:'image' },
 { title:'अपना जीवनसाथी खोजें', sub:'मैट्रिमोनी', body:'स्वीकृत प्रोफाइल देखें, अपनी पसंद के अनुसार खोजें और रुचि भेजें।', image:MATRIMONY, kind:'image' },
 { title:'समाज से जुड़े रहें', sub:'समाज अपडेट्स', body:'समाचार, कार्यक्रम, शोक सूचना और समाज के विज्ञापन एक ही जगह।', kind:'community' },
 { title:'अपना प्रोफाइल प्रबंधित करें', sub:'मेरा प्रोफाइल', body:'अपनी जानकारी, मैट्रिमोनी प्रोफाइल, पासवर्ड और ऐप सेटिंग्स आसानी से संभालें।', kind:'profile' },
 { title:'अपना योगदान दें', sub:'नई जानकारी जोड़ें', body:'समाचार, कार्यक्रम, शोक सूचना या विज्ञापन जोड़ें। Admin approval के बाद ही यह public होगा।', kind:'contribute' },
 { title:'आप तैयार हैं!', sub:'दामोदर प्रयास', body:'मैट्रिमोनी, समाज, समिति, समाचार, समारोह, शोक सूचना और विज्ञापन अब आपके साथ।', kind:'finish' },
] as const;

function Art({slide}:{slide:(typeof slides)[number]}) {
 if(slide.kind==='image') return <Image source={slide.image} style={styles.artImage} contentFit="cover" />;
 const names = slide.kind==='community' ? ['समाचार','समारोह','शोक सूचना','विज्ञापन'] : slide.kind==='profile' ? ['मेरी प्रोफाइल','मैट्रिमोनी','Password','Settings'] : slide.kind==='contribute' ? ['समाचार भेजें','कार्यक्रम जोड़ें','शोक सूचना','विज्ञापन डालें'] : ['मैट्रिमोनी','समाज','समिति','समाचार'];
 return <View style={styles.grid}>{names.map((x,i)=><View key={x} style={styles.tile}><SymbolView name={{ios:['newspaper.fill','calendar','person.3.fill','megaphone.fill'][i],android:['newspaper','calendar_month','groups','campaign'][i],web:['newspaper','calendar_month','groups','campaign'][i]} as any} tintColor={i%2?C.gold:C.maroon} size={30}/><Text style={styles.tileText}>{x}</Text></View>)}</View>;
}

export default function OnboardingScreen(){
 const ref=useRef<FlatList<(typeof slides)[number]>>(null); const [index,setIndex]=useState(0);
 async function done(){await AsyncStorage.setItem(ONBOARDING_KEY,'1');router.replace('/');}
 const next=()=>index===slides.length-1?void done():ref.current?.scrollToIndex({index:index+1,animated:true});
 const viewability=useRef(({viewableItems}:{viewableItems:Array<ViewToken<(typeof slides)[number]>})=>{const i=viewableItems[0]?.index;if(i!=null)setIndex(i);}).current;
 return <SafeAreaView style={styles.safe}>
  <FlatList ref={ref} data={slides} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={x=>x.title} onViewableItemsChanged={viewability} viewabilityConfig={{itemVisiblePercentThreshold:60}}
   renderItem={({item,i})=><View style={styles.slide}>
    <View style={styles.top}><Image source={ICON} style={styles.logo}/>{i<slides.length-1?<Pressable onPress={()=>void done()}><Text style={styles.skip}>छोड़ें</Text></Pressable>:<View/>}</View>
    <Text style={styles.eyebrow}>{item.sub}</Text><Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.body}</Text>
    <View style={styles.art}><Art slide={item}/></View>
   </View>}/>
  <View style={styles.footer}><View style={styles.dots}>{slides.map((_,i)=><View key={i} style={[styles.dot,i===index&&styles.dotActive]}/>)}</View>
   <Pressable style={styles.next} onPress={next}><Text style={styles.nextText}>{index===slides.length-1?'शुरू करें':'आगे  →'}</Text></Pressable>
  </View>
 </SafeAreaView>
}
const styles=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.paper},slide:{width,paddingHorizontal:26,paddingTop:10},top:{height:54,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},logo:{width:48,height:48,borderRadius:12},skip:{color:C.maroon,fontWeight:'800',fontSize:15},eyebrow:{marginTop:18,textAlign:'center',color:C.gold,fontSize:16,fontWeight:'900'},title:{marginTop:6,textAlign:'center',color:C.maroon,fontSize:32,fontWeight:'900'},body:{marginTop:10,textAlign:'center',color:C.muted,fontSize:16,lineHeight:24},art:{flex:1,marginTop:24,marginBottom:120,borderRadius:28,overflow:'hidden',backgroundColor:'#FFF',borderWidth:1,borderColor:'#E9D9C8',justifyContent:'center'},artImage:{width:'100%',height:'100%'},grid:{padding:20,flexDirection:'row',flexWrap:'wrap',gap:14,justifyContent:'center'},tile:{width:'43%',minHeight:120,borderRadius:22,backgroundColor:'#FFF7F0',borderWidth:1,borderColor:'#ECD8C8',alignItems:'center',justifyContent:'center',gap:10},tileText:{fontSize:15,fontWeight:'800',color:C.ink,textAlign:'center'},footer:{position:'absolute',left:0,right:0,bottom:0,minHeight:112,backgroundColor:C.maroon,borderTopLeftRadius:32,borderTopRightRadius:32,paddingHorizontal:26,paddingTop:18,paddingBottom:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},dots:{flexDirection:'row',gap:8},dot:{width:8,height:8,borderRadius:4,backgroundColor:'#C36C7B'},dotActive:{width:24,backgroundColor:'#FFE4A1'},next:{minWidth:132,height:52,paddingHorizontal:20,borderRadius:26,backgroundColor:'#FFF9EE',alignItems:'center',justifyContent:'center'},nextText:{color:C.maroon,fontSize:17,fontWeight:'900'}
});